import { Request, Response, NextFunction } from 'express';
import { adminService, AdminApproveSchema, AdminBadgeSchema, AdminServiceTagSchema } from '../services/admin.service';
import { z } from 'zod';

const FeaturedSchema = z.object({
  featured: z.boolean(),
  featuredUntil: z.string().datetime().optional(),
  featuredOrder: z.number().int().optional(),
});

export const adminController = {
  async getDashboard(req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await adminService.getDashboardStats();
      res.json(stats);
    } catch (err) { next(err); }
  },

  async getCompanies(req: Request, res: Response, next: NextFunction) {
    try {
      const { status, search, page, limit } = req.query as Record<string, string>;
      const result = await adminService.getAllCompanies({
        status,
        search,
        page: page ? parseInt(page) : undefined,
        limit: limit ? parseInt(limit) : undefined,
      });
      res.json(result);
    } catch (err) { next(err); }
  },

  async getPendingCompanies(req: Request, res: Response, next: NextFunction) {
    try {
      const { page, limit } = req.query as Record<string, string>;
      const result = await adminService.getPendingCompanies(
        page ? parseInt(page) : 1,
        limit ? parseInt(limit) : 20
      );
      res.json(result);
    } catch (err) { next(err); }
  },

  async reviewCompany(req: Request, res: Response, next: NextFunction) {
    try {
      const { action, rejectionReason } = AdminApproveSchema.parse(req.body);
      const result = await adminService.reviewCompany(req, req.params.id, action, rejectionReason);
      res.json(result);
    } catch (err) { next(err); }
  },

  async updateBadges(req: Request, res: Response, next: NextFunction) {
    try {
      const data = AdminBadgeSchema.parse(req.body);
      const result = await adminService.updateBadges(req, req.params.id, data);
      res.json(result);
    } catch (err) { next(err); }
  },

  async updateFeatured(req: Request, res: Response, next: NextFunction) {
    try {
      const { featured, featuredUntil, featuredOrder } = FeaturedSchema.parse(req.body);
      const result = await adminService.updateFeatured(req, req.params.id, featured, featuredUntil, featuredOrder);
      res.json(result);
    } catch (err) { next(err); }
  },

  async assignServiceTags(req: Request, res: Response, next: NextFunction) {
    try {
      const { tagIds } = AdminServiceTagSchema.parse(req.body);
      const result = await adminService.assignServiceTags(req, req.params.id, tagIds);
      res.json(result);
    } catch (err) { next(err); }
  },

  async getPendingBlogs(req: Request, res: Response, next: NextFunction) {
    try {
      const { page, limit } = req.query as Record<string, string>;
      const result = await adminService.getPendingBlogs(
        page ? parseInt(page) : 1,
        limit ? parseInt(limit) : 20
      );
      res.json(result);
    } catch (err) { next(err); }
  },

  async reviewBlog(req: Request, res: Response, next: NextFunction) {
    try {
      const { action, rejectionReason } = z.object({
        action: z.enum(['publish', 'reject']),
        rejectionReason: z.string().min(5).optional(),
      }).parse(req.body);

      const result = await adminService.reviewBlog(req, req.params.id, action, rejectionReason);
      res.json(result);
    } catch (err) { next(err); }
  },

  async getAuditLogs(req: Request, res: Response, next: NextFunction) {
    try {
      const { page, limit } = req.query as Record<string, string>;
      const result = await adminService.getAuditLogs(
        page ? parseInt(page) : 1,
        limit ? parseInt(limit) : 50
      );
      res.json(result);
    } catch (err) { next(err); }
  },
};
