import { Router } from 'express';
import prisma from '../config/database';

const router = Router();

// Industries list (for filter dropdowns)
router.get('/industries', async (_req, res, next) => {
  try {
    const industries = await prisma.industry.findMany({
      where: { isActive: true },
      include: { categories: { where: { isActive: true }, orderBy: { sortOrder: 'asc' } } },
      orderBy: { sortOrder: 'asc' },
    });
    res.json(industries);
  } catch (err) { next(err); }
});

// TruVis service tags (for filter display)
router.get('/service-tags', async (_req, res, next) => {
  try {
    const tags = await prisma.truvisServiceTag.findMany({
      where: { isActive: true },
    });
    res.json(tags);
  } catch (err) { next(err); }
});

// Countries/cities available (for filter dropdowns)
router.get('/filters/locations', async (_req, res, next) => {
  try {
    const countries = await prisma.company.groupBy({
      by: ['country'],
      where: { status: 'approved', country: { not: null } },
      _count: { country: true },
      orderBy: { _count: { country: 'desc' } },
    });
    res.json({ countries: countries.map(c => ({ name: c.country, count: c._count.country })) });
  } catch (err) { next(err); }
});

// Stats for homepage
router.get('/stats', async (_req, res, next) => {
  try {
    const [total, verified, countries] = await Promise.all([
      prisma.company.count({ where: { status: 'approved' } }),
      prisma.company.count({ where: { status: 'approved', truvisVerified: true } }),
      prisma.company.groupBy({
        by: ['country'],
        where: { status: 'approved', country: { not: null } },
      }).then(r => r.length),
    ]);
    res.json({ total, verified, countries });
  } catch (err) { next(err); }
});

// Featured companies for homepage
router.get('/featured', async (_req, res, next) => {
  try {
    const companies = await prisma.company.findMany({
      where: {
        status: 'approved',
        featured: true,
        OR: [
          { featuredUntil: null },
          { featuredUntil: { gt: new Date() } },
        ],
      },
      orderBy: [{ featuredOrder: 'asc' }, { rankScore: 'desc' }],
      take: 12,
      include: {
        industries: {
          include: { industry: { select: { name: true, slug: true } } },
          where: { isPrimary: true },
        },
        serviceTags: { include: { tag: { select: { name: true, icon: true } } } },
      },
    });
    res.json(companies);
  } catch (err) { next(err); }
});

export default router;
