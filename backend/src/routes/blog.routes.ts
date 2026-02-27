import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth';
import { z } from 'zod';
import DOMPurify from 'isomorphic-dompurify';
import prisma from '../config/database';
import { uniqueBlogSlug } from '../utils/slugify';

const router = Router();

const ALLOWED_TAGS = ['p', 'h2', 'h3', 'h4', 'ul', 'ol', 'li', 'strong', 'em', 'a', 'blockquote', 'br', 'img'];

const CreatePostSchema = z.object({
  title: z.string().min(5).max(500),
  content: z.string().min(100).max(200000),
  excerpt: z.string().max(1000).optional(),
  metaTitle: z.string().max(255).optional(),
  metaDescription: z.string().max(500).optional(),
});

// Public: list published blog posts
router.get('/', async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string || '1'));
    const limit = Math.min(20, parseInt(req.query.limit as string || '10'));
    const offset = (page - 1) * limit;

    const [posts, total] = await Promise.all([
      prisma.blogPost.findMany({
        where: { status: 'published' },
        include: { company: { select: { name: true, slug: true, logoUrl: true } } },
        orderBy: { publishedAt: 'desc' },
        skip: offset,
        take: limit,
        select: {
          id: true, slug: true, title: true, excerpt: true,
          coverUrl: true, publishedAt: true, viewsCount: true,
          company: true,
        },
      }),
      prisma.blogPost.count({ where: { status: 'published' } }),
    ]);

    res.json({ data: posts, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
  } catch (err) { next(err); }
});

// Public: get single blog post
router.get('/:slug', async (req, res, next) => {
  try {
    const post = await prisma.blogPost.findFirst({
      where: { slug: req.params.slug, status: 'published' },
      include: { company: { select: { name: true, slug: true, logoUrl: true, truvisVerified: true, truvisClient: true } } },
    });

    if (!post) { res.status(404).json({ error: 'Post not found' }); return; }

    // Increment view count (fire and forget)
    prisma.blogPost.update({ where: { id: post.id }, data: { viewsCount: { increment: 1 } } }).catch(() => {});

    res.json(post);
  } catch (err) { next(err); }
});

// Authenticated: company submits blog post
router.post(
  '/',
  authenticate,
  requireRole('company', 'admin', 'super_admin'),
  async (req, res, next) => {
    try {
      const data = CreatePostSchema.parse(req.body);
      const company = await prisma.company.findUnique({
        where: { userId: req.user!.id },
        select: { id: true, status: true },
      });

      if (!company || company.status !== 'approved') {
        res.status(403).json({ error: 'Only approved companies can submit blog posts' });
        return;
      }

      const sanitizedContent = DOMPurify.sanitize(data.content, { ALLOWED_TAGS });
      const slug = await uniqueBlogSlug(data.title);

      const post = await prisma.blogPost.create({
        data: {
          companyId: company.id,
          authorId: req.user!.id,
          title: data.title,
          slug,
          content: sanitizedContent,
          excerpt: data.excerpt,
          metaTitle: data.metaTitle,
          metaDescription: data.metaDescription,
          status: 'pending',
        },
      });

      res.status(201).json(post);
    } catch (err) { next(err); }
  }
);

// Authenticated: get own blog posts
router.get(
  '/me/posts',
  authenticate,
  requireRole('company', 'admin', 'super_admin'),
  async (req, res, next) => {
    try {
      const company = await prisma.company.findUnique({
        where: { userId: req.user!.id },
        select: { id: true },
      });

      if (!company) { res.status(404).json({ error: 'Company not found' }); return; }

      const posts = await prisma.blogPost.findMany({
        where: { companyId: company.id },
        orderBy: { createdAt: 'desc' },
      });

      res.json(posts);
    } catch (err) { next(err); }
  }
);

export default router;
