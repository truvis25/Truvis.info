import { Router } from 'express';
import { companyController } from '../controllers/company.controller';
import { authenticate, requireRole } from '../middleware/auth';
import { contactLimiter, uploadLimiter } from '../middleware/rateLimiter';
import { uploadMiddleware } from '../middleware/upload';

const router = Router();

// ── Public routes ────────────────────────────────
router.get('/', companyController.search);
router.get('/:slug', companyController.getPublicProfile);
router.post('/:slug/contact', contactLimiter, companyController.contact);

// ── Authenticated company routes ─────────────────
router.get('/me/profile', authenticate, requireRole('company', 'admin', 'super_admin'), companyController.getMyProfile);
router.patch('/me/profile', authenticate, requireRole('company', 'admin', 'super_admin'), companyController.updateProfile);
router.post('/me/submit', authenticate, requireRole('company'), companyController.submitForApproval);

// Media upload
router.post(
  '/me/logo',
  authenticate,
  requireRole('company', 'admin', 'super_admin'),
  uploadLimiter,
  uploadMiddleware.single('file'),
  async (req, res, next) => {
    try {
      if (!req.file) { res.status(400).json({ error: 'No file uploaded' }); return; }
      const { storageService } = await import('../services/storage.service');
      const url = await storageService.uploadCompanyMedia(req.user!.id, 'logo', req.file);
      const prisma = (await import('../config/database')).default;
      await prisma.company.update({ where: { userId: req.user!.id }, data: { logoUrl: url } });
      const { companyService } = await import('../services/company.service');
      await companyService.updateProfileScore(
        (await prisma.company.findUnique({ where: { userId: req.user!.id }, select: { id: true } }))!.id
      );
      res.json({ url });
    } catch (err) { next(err); }
  }
);

router.post(
  '/me/cover',
  authenticate,
  requireRole('company', 'admin', 'super_admin'),
  uploadLimiter,
  uploadMiddleware.single('file'),
  async (req, res, next) => {
    try {
      if (!req.file) { res.status(400).json({ error: 'No file uploaded' }); return; }
      const { storageService } = await import('../services/storage.service');
      const url = await storageService.uploadCompanyMedia(req.user!.id, 'cover', req.file);
      const prisma = (await import('../config/database')).default;
      await prisma.company.update({ where: { userId: req.user!.id }, data: { coverUrl: url } });
      res.json({ url });
    } catch (err) { next(err); }
  }
);

router.post(
  '/me/gallery',
  authenticate,
  requireRole('company', 'admin', 'super_admin'),
  uploadLimiter,
  uploadMiddleware.single('file'),
  async (req, res, next) => {
    try {
      if (!req.file) { res.status(400).json({ error: 'No file uploaded' }); return; }
      const { storageService } = await import('../services/storage.service');
      const url = await storageService.uploadCompanyMedia(req.user!.id, 'gallery', req.file);
      const prisma = (await import('../config/database')).default;
      const company = await prisma.company.findUnique({ where: { userId: req.user!.id } });
      if (!company) { res.status(404).json({ error: 'Company not found' }); return; }
      const gallery = (Array.isArray(company.gallery) ? company.gallery as string[] : []);
      if (gallery.length >= 20) { res.status(400).json({ error: 'Gallery limit reached (20 images)' }); return; }
      await prisma.company.update({ where: { id: company.id }, data: { gallery: [...gallery, url] } });
      res.json({ url, gallery: [...gallery, url] });
    } catch (err) { next(err); }
  }
);

// Services
router.post('/me/services', authenticate, requireRole('company', 'admin', 'super_admin'), companyController.addService);
router.delete('/me/services/:serviceId', authenticate, requireRole('company', 'admin', 'super_admin'), companyController.deleteService);

export default router;
