import { Router } from 'express';
import { adminController } from '../controllers/admin.controller';
import { authenticate, isAdmin } from '../middleware/auth';

const router = Router();

// All admin routes require authentication + admin role
router.use(authenticate, isAdmin);

// Dashboard
router.get('/dashboard', adminController.getDashboard);

// Companies
router.get('/companies', adminController.getCompanies);
router.get('/companies/pending', adminController.getPendingCompanies);
router.patch('/companies/:id/review', adminController.reviewCompany);
router.patch('/companies/:id/badges', adminController.updateBadges);
router.patch('/companies/:id/featured', adminController.updateFeatured);
router.patch('/companies/:id/tags', adminController.assignServiceTags);

// Blog moderation
router.get('/blogs/pending', adminController.getPendingBlogs);
router.patch('/blogs/:id/review', adminController.reviewBlog);

// Audit logs
router.get('/audit-logs', adminController.getAuditLogs);

export default router;
