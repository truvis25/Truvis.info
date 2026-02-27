import { z } from 'zod';
import prisma from '../config/database';
import { emailService } from './email.service';
import { companyService } from './company.service';
import { config } from '../config';
import { createAuditLog } from '../middleware/auditLog';
import { Request } from 'express';
import logger from '../utils/logger';

export const AdminApproveSchema = z.object({
  action: z.enum(['approve', 'reject']),
  rejectionReason: z.string().min(10).max(1000).optional(),
});

export const AdminBadgeSchema = z.object({
  truvisClient: z.boolean().optional(),
  truvisVerified: z.boolean().optional(),
});

export const AdminServiceTagSchema = z.object({
  tagIds: z.array(z.string().uuid()),
});

export const adminService = {
  async getPendingCompanies(page = 1, limit = 20) {
    const offset = (page - 1) * limit;
    const [companies, total] = await Promise.all([
      prisma.company.findMany({
        where: { status: 'pending' },
        include: {
          user: { select: { email: true, createdAt: true } },
          industries: { include: { industry: true } },
        },
        orderBy: { updatedAt: 'asc' },
        skip: offset,
        take: limit,
      }),
      prisma.company.count({ where: { status: 'pending' } }),
    ]);

    return { data: companies, total, pages: Math.ceil(total / limit), page };
  },

  async getAllCompanies(filters: {
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const page = Math.max(1, filters.page || 1);
    const limit = Math.min(100, filters.limit || 20);
    const offset = (page - 1) * limit;

    const where: any = {};
    if (filters.status) where.status = filters.status;
    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { email: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const [companies, total] = await Promise.all([
      prisma.company.findMany({
        where,
        include: { user: { select: { email: true } } },
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit,
      }),
      prisma.company.count({ where }),
    ]);

    return { data: companies, total, pages: Math.ceil(total / limit), page };
  },

  async reviewCompany(
    req: Request,
    companyId: string,
    action: 'approve' | 'reject',
    rejectionReason?: string
  ) {
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      include: { user: { select: { email: true } } },
    });

    if (!company) throw Object.assign(new Error('Company not found'), { status: 404 });
    if (company.status !== 'pending') {
      throw Object.assign(new Error(`Company is already ${company.status}`), { status: 400 });
    }

    if (action === 'reject' && !rejectionReason) {
      throw Object.assign(new Error('Rejection reason is required'), { status: 422 });
    }

    const oldValues = { status: company.status };

    const updated = await prisma.company.update({
      where: { id: companyId },
      data: {
        status: action === 'approve' ? 'approved' : 'rejected',
        rejectionReason: action === 'reject' ? rejectionReason : null,
        approvedAt: action === 'approve' ? new Date() : null,
        approvedById: action === 'approve' ? req.user?.id : null,
      },
    });

    await createAuditLog(req, {
      action: `company.${action}`,
      entityType: 'company',
      entityId: companyId,
      oldValues,
      newValues: { status: updated.status, rejectionReason: updated.rejectionReason },
    });

    // Recalculate scores on approval
    if (action === 'approve') {
      await companyService.updateProfileScore(companyId);
      emailService
        .sendApprovalEmail(
          company.user.email,
          company.name,
          `${config.appUrl}/directory/${company.slug}`
        )
        .catch((err) => logger.error('[Admin] Approval email failed', { err }));
    } else {
      emailService
        .sendRejectionEmail(company.user.email, company.name, rejectionReason || '')
        .catch((err) => logger.error('[Admin] Rejection email failed', { err }));
    }

    return updated;
  },

  async updateBadges(req: Request, companyId: string, data: z.infer<typeof AdminBadgeSchema>) {
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      include: { user: { select: { email: true } } },
    });
    if (!company) throw Object.assign(new Error('Company not found'), { status: 404 });

    const oldValues = {
      truvisClient: company.truvisClient,
      truvisVerified: company.truvisVerified,
    };

    const updateData: any = {};
    if (data.truvisClient !== undefined) updateData.truvisClient = data.truvisClient;
    if (data.truvisVerified !== undefined) {
      updateData.truvisVerified = data.truvisVerified;
      if (data.truvisVerified) {
        updateData.verifiedAt = new Date();
        updateData.verifiedById = req.user?.id;
      } else {
        updateData.verifiedAt = null;
        updateData.verifiedById = null;
      }
    }

    const updated = await prisma.company.update({
      where: { id: companyId },
      data: updateData,
    });

    await createAuditLog(req, {
      action: 'company.badges.update',
      entityType: 'company',
      entityId: companyId,
      oldValues,
      newValues: data,
    });

    // Recalculate rank score (badges affect ranking)
    await companyService.updateProfileScore(companyId);

    // Notify company on badge grant
    if (data.truvisClient && !oldValues.truvisClient) {
      emailService
        .sendBadgeEmail(company.user.email, company.name, 'client')
        .catch(() => {});
    }
    if (data.truvisVerified && !oldValues.truvisVerified) {
      emailService
        .sendBadgeEmail(company.user.email, company.name, 'verified')
        .catch(() => {});
    }

    return updated;
  },

  async updateFeatured(req: Request, companyId: string, featured: boolean, featuredUntil?: string, featuredOrder?: number) {
    const company = await prisma.company.findUnique({ where: { id: companyId } });
    if (!company) throw Object.assign(new Error('Company not found'), { status: 404 });

    const updated = await prisma.company.update({
      where: { id: companyId },
      data: {
        featured,
        featuredUntil: featuredUntil ? new Date(featuredUntil) : null,
        featuredOrder: featuredOrder || 0,
      },
    });

    await createAuditLog(req, {
      action: 'company.featured.update',
      entityType: 'company',
      entityId: companyId,
      newValues: { featured, featuredUntil, featuredOrder },
    });

    await companyService.updateProfileScore(companyId);
    return updated;
  },

  async assignServiceTags(req: Request, companyId: string, tagIds: string[]) {
    const company = await prisma.company.findUnique({ where: { id: companyId } });
    if (!company) throw Object.assign(new Error('Company not found'), { status: 404 });

    await prisma.$transaction(async (tx) => {
      await tx.companyServiceTag.deleteMany({ where: { companyId } });
      if (tagIds.length > 0) {
        await tx.companyServiceTag.createMany({
          data: tagIds.map((tagId) => ({
            companyId,
            tagId,
            assignedById: req.user?.id,
          })),
        });
      }
    });

    await createAuditLog(req, {
      action: 'company.tags.assign',
      entityType: 'company',
      entityId: companyId,
      newValues: { tagIds },
    });

    await companyService.updateProfileScore(companyId);
    return companyService.getById(companyId);
  },

  async getPendingBlogs(page = 1, limit = 20) {
    const offset = (page - 1) * limit;
    const [posts, total] = await Promise.all([
      prisma.blogPost.findMany({
        where: { status: 'pending' },
        include: { company: { select: { name: true, slug: true } }, author: { select: { email: true } } },
        orderBy: { updatedAt: 'asc' },
        skip: offset,
        take: limit,
      }),
      prisma.blogPost.count({ where: { status: 'pending' } }),
    ]);
    return { data: posts, total, pages: Math.ceil(total / limit), page };
  },

  async reviewBlog(req: Request, postId: string, action: 'publish' | 'reject', rejectionReason?: string) {
    const post = await prisma.blogPost.findUnique({
      where: { id: postId },
      include: { author: { select: { email: true } }, company: { select: { name: true } } },
    });

    if (!post) throw Object.assign(new Error('Post not found'), { status: 404 });

    const updated = await prisma.blogPost.update({
      where: { id: postId },
      data: {
        status: action === 'publish' ? 'published' : 'rejected',
        rejectionReason: action === 'reject' ? rejectionReason : null,
        publishedAt: action === 'publish' ? new Date() : null,
      },
    });

    await createAuditLog(req, {
      action: `blog.${action}`,
      entityType: 'blog_post',
      entityId: postId,
    });

    return updated;
  },

  async getDashboardStats() {
    const [
      totalCompanies,
      approvedCompanies,
      pendingCompanies,
      verifiedCompanies,
      pendingBlogs,
      recentInquiries,
    ] = await Promise.all([
      prisma.company.count(),
      prisma.company.count({ where: { status: 'approved' } }),
      prisma.company.count({ where: { status: 'pending' } }),
      prisma.company.count({ where: { truvisVerified: true } }),
      prisma.blogPost.count({ where: { status: 'pending' } }),
      prisma.contactInquiry.count({
        where: { createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } },
      }),
    ]);

    return {
      totalCompanies,
      approvedCompanies,
      pendingCompanies,
      verifiedCompanies,
      pendingBlogs,
      recentInquiries,
    };
  },

  async getAuditLogs(page = 1, limit = 50) {
    const offset = (page - 1) * limit;
    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        include: { user: { select: { email: true, role: true } } },
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit,
      }),
      prisma.auditLog.count(),
    ]);
    return { data: logs, total, pages: Math.ceil(total / limit), page };
  },
};
