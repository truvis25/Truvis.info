import { z } from 'zod';
import DOMPurify from 'isomorphic-dompurify';
import prisma from '../config/database';
import { computeProfileScore, computeRankScore } from '../utils/profileScore';
import { uniqueCompanySlug } from '../utils/slugify';
import { emailService } from './email.service';
import { config } from '../config';
import logger from '../utils/logger';

// ─────────────────────────────────────────
// VALIDATION SCHEMAS
// ─────────────────────────────────────────

const SocialLinksSchema = z.object({
  linkedin: z.string().url().optional().or(z.literal('')),
  twitter: z.string().url().optional().or(z.literal('')),
  instagram: z.string().url().optional().or(z.literal('')),
  facebook: z.string().url().optional().or(z.literal('')),
  youtube: z.string().url().optional().or(z.literal('')),
}).partial();

export const UpdateProfileSchema = z.object({
  name: z.string().min(2).max(255).optional(),
  licenseNumber: z.string().max(100).optional(),
  description: z.string().max(50000).optional(),
  tagline: z.string().max(500).optional(),
  foundedYear: z.number().int().min(1800).max(new Date().getFullYear()).optional(),
  employeeCount: z.enum(['1-10', '11-50', '51-200', '201-500', '500+']).optional(),
  website: z.string().url().max(500).optional().or(z.literal('')),
  email: z.string().email().max(255).optional().or(z.literal('')),
  phone: z.string().max(50).optional(),
  whatsapp: z.string().max(50).optional(),
  address: z.string().max(500).optional(),
  city: z.string().max(100).optional(),
  country: z.string().max(100).optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  videoUrl: z.string().url().max(500).optional().or(z.literal('')),
  socialLinks: SocialLinksSchema.optional(),
  metaTitle: z.string().max(255).optional(),
  metaDescription: z.string().max(500).optional(),
  industryIds: z.array(z.string().uuid()).max(5).optional(),
  categoryIds: z.array(z.string().uuid()).max(10).optional(),
  primaryIndustryId: z.string().uuid().optional(),
});

export const ServiceSchema = z.object({
  type: z.enum(['service', 'product', 'capability']),
  title: z.string().min(2).max(255),
  description: z.string().max(2000).optional(),
  sortOrder: z.number().int().optional(),
});

const ALLOWED_TAGS = ['p', 'h2', 'h3', 'h4', 'ul', 'ol', 'li', 'strong', 'em', 'a', 'blockquote', 'br', 'img'];

// ─────────────────────────────────────────
// SERVICE
// ─────────────────────────────────────────

export const companyService = {
  async getMyCompany(userId: string) {
    return prisma.company.findUnique({
      where: { userId },
      include: {
        industries: { include: { industry: true } },
        categories: { include: { category: true } },
        serviceTags: { include: { tag: true } },
        services: { orderBy: { sortOrder: 'asc' } },
        subscription: { include: { plan: true } },
      },
    });
  },

  async updateProfile(userId: string, data: z.infer<typeof UpdateProfileSchema>) {
    const company = await prisma.company.findUnique({ where: { userId } });
    if (!company) throw Object.assign(new Error('Company not found'), { status: 404 });

    // Sanitize description HTML
    let description = data.description;
    if (description) {
      description = DOMPurify.sanitize(description, { ALLOWED_TAGS });
    }

    // Handle slug update if name changes
    let slug = company.slug;
    if (data.name && data.name !== company.name) {
      slug = await uniqueCompanySlug(data.name, company.id);
    }

    const updateData: any = {
      ...data,
      description,
      slug,
      lastActivityAt: new Date(),
    };

    // Handle industry/category M2M separately
    delete updateData.industryIds;
    delete updateData.categoryIds;
    delete updateData.primaryIndustryId;

    // Map employee count
    if (data.employeeCount) {
      const countMap: Record<string, string> = {
        '1-10': 'one_to_ten',
        '11-50': 'eleven_to_fifty',
        '51-200': 'fifty_to_two',
        '201-500': 'two_to_five',
        '500+': 'five_plus',
      };
      updateData.employeeCount = countMap[data.employeeCount] || data.employeeCount;
    }

    const updated = await prisma.$transaction(async (tx) => {
      const updatedCompany = await tx.company.update({
        where: { id: company.id },
        data: updateData,
      });

      // Update industry relations
      if (data.industryIds !== undefined) {
        await tx.companyIndustry.deleteMany({ where: { companyId: company.id } });
        if (data.industryIds.length > 0) {
          await tx.companyIndustry.createMany({
            data: data.industryIds.map((industryId) => ({
              companyId: company.id,
              industryId,
              isPrimary: industryId === data.primaryIndustryId,
            })),
          });
        }
      }

      // Update category relations
      if (data.categoryIds !== undefined) {
        await tx.companyCategory.deleteMany({ where: { companyId: company.id } });
        if (data.categoryIds.length > 0) {
          await tx.companyCategory.createMany({
            data: data.categoryIds.map((categoryId) => ({
              companyId: company.id,
              categoryId,
            })),
          });
        }
      }

      return updatedCompany;
    });

    // Recalculate profile score
    await this.updateProfileScore(updated.id);

    return this.getById(updated.id);
  },

  async updateProfileScore(companyId: string) {
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      include: { serviceTags: true },
    });
    if (!company) return;

    const profileScore = computeProfileScore(company);
    const rankScore = computeRankScore({
      ...company,
      serviceTagCount: company.serviceTags.length,
    });

    await prisma.company.update({
      where: { id: companyId },
      data: {
        profileScore,
        rankScore: rankScore.toString(),
      },
    });
  },

  async submitForApproval(userId: string) {
    const company = await prisma.company.findUnique({ where: { userId } });
    if (!company) throw Object.assign(new Error('Company not found'), { status: 404 });

    if (company.status === 'approved') {
      throw Object.assign(new Error('Company is already approved'), { status: 400 });
    }

    if (company.status === 'pending') {
      throw Object.assign(new Error('Already submitted for review'), { status: 400 });
    }

    // Minimum requirements check
    if (!company.name || !company.country || !company.city) {
      throw Object.assign(
        new Error('Please complete basic information (name, country, city) before submitting'),
        { status: 422 }
      );
    }

    const updated = await prisma.company.update({
      where: { id: company.id },
      data: { status: 'pending', lastActivityAt: new Date() },
    });

    // Notify admin
    emailService
      .sendAdminNotification(
        config.email.adminEmail,
        'New company profile pending review',
        `<p><strong>${company.name}</strong> has submitted their profile for approval.</p>
         <a href="${config.appUrl}/admin/companies/${company.id}" class="btn">Review Profile</a>`
      )
      .catch((err) => logger.error('[Company] Admin notification failed', { err }));

    return updated;
  },

  async getById(id: string) {
    return prisma.company.findUnique({
      where: { id },
      include: {
        industries: { include: { industry: true } },
        categories: { include: { category: true } },
        serviceTags: { include: { tag: true } },
        services: { orderBy: { sortOrder: 'asc' } },
      },
    });
  },

  async getPublicProfile(slug: string) {
    const company = await prisma.company.findUnique({
      where: { slug },
      include: {
        industries: { include: { industry: true } },
        categories: { include: { category: true } },
        serviceTags: { include: { tag: true } },
        services: { orderBy: { sortOrder: 'asc' } },
        blogPosts: {
          where: { status: 'published' },
          orderBy: { publishedAt: 'desc' },
          take: 5,
          select: {
            id: true,
            slug: true,
            title: true,
            excerpt: true,
            coverUrl: true,
            publishedAt: true,
          },
        },
      },
    });

    if (!company || company.status !== 'approved') {
      return null;
    }

    // Increment view count (fire and forget)
    prisma.company.update({
      where: { id: company.id },
      data: { viewsCount: { increment: 1 } },
    }).catch(() => {});

    return company;
  },

  async search(params: {
    q?: string;
    country?: string;
    city?: string;
    industryId?: string;
    truvisVerified?: boolean;
    truvisClient?: boolean;
    tagSlug?: string;
    featured?: boolean;
    sortBy?: 'az' | 'newest' | 'verified' | 'rank';
    page?: number;
    limit?: number;
  }) {
    const page = Math.max(1, params.page || 1);
    const limit = Math.min(50, Math.max(1, params.limit || 20));
    const offset = (page - 1) * limit;

    const where: any = { status: 'approved' };

    if (params.country) where.country = params.country;
    if (params.city) where.city = { contains: params.city, mode: 'insensitive' };
    if (params.truvisVerified === true) where.truvisVerified = true;
    if (params.truvisClient === true) where.truvisClient = true;
    if (params.featured === true) where.featured = true;

    if (params.industryId) {
      where.industries = { some: { industryId: params.industryId } };
    }

    if (params.tagSlug) {
      where.serviceTags = { some: { tag: { slug: params.tagSlug } } };
    }

    if (params.q) {
      where.OR = [
        { name: { contains: params.q, mode: 'insensitive' } },
        { description: { contains: params.q, mode: 'insensitive' } },
        { tagline: { contains: params.q, mode: 'insensitive' } },
        { city: { contains: params.q, mode: 'insensitive' } },
      ];
    }

    let orderBy: any;
    switch (params.sortBy) {
      case 'az':
        orderBy = [{ name: 'asc' }];
        break;
      case 'newest':
        orderBy = [{ approvedAt: 'desc' }];
        break;
      case 'verified':
        orderBy = [{ truvisVerified: 'desc' }, { truvisClient: 'desc' }, { rankScore: 'desc' }];
        break;
      case 'rank':
      default:
        orderBy = [{ featured: 'desc' }, { rankScore: 'desc' }, { approvedAt: 'desc' }];
    }

    const [companies, total] = await Promise.all([
      prisma.company.findMany({
        where,
        orderBy,
        skip: offset,
        take: limit,
        include: {
          industries: { include: { industry: { select: { name: true, slug: true } } }, where: { isPrimary: true } },
          serviceTags: { include: { tag: { select: { name: true, slug: true, icon: true } } } },
        },
      }),
      prisma.company.count({ where }),
    ]);

    return {
      data: companies,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  },

  async addService(userId: string, data: z.infer<typeof ServiceSchema>) {
    const company = await prisma.company.findUnique({ where: { userId }, select: { id: true } });
    if (!company) throw Object.assign(new Error('Company not found'), { status: 404 });

    const service = await prisma.service.create({
      data: { ...data, companyId: company.id },
    });

    await this.updateProfileScore(company.id);
    return service;
  },

  async deleteService(userId: string, serviceId: string) {
    const company = await prisma.company.findUnique({ where: { userId }, select: { id: true } });
    if (!company) throw Object.assign(new Error('Company not found'), { status: 404 });

    const service = await prisma.service.findFirst({
      where: { id: serviceId, companyId: company.id },
    });
    if (!service) throw Object.assign(new Error('Service not found'), { status: 404 });

    await prisma.service.delete({ where: { id: serviceId } });
    await this.updateProfileScore(company.id);
  },
};
