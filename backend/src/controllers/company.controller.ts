import { Request, Response, NextFunction } from 'express';
import { companyService, UpdateProfileSchema, ServiceSchema } from '../services/company.service';
import { z } from 'zod';

const ContactSchema = z.object({
  senderName: z.string().min(2).max(255),
  senderEmail: z.string().email().max(255),
  senderPhone: z.string().max(50).optional(),
  subject: z.string().max(255).optional(),
  message: z.string().min(10).max(5000),
  recaptchaToken: z.string().optional(),
});

export const companyController = {
  // ── Company (authenticated) ──────────────────

  async getMyProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const company = await companyService.getMyCompany(req.user!.id);
      if (!company) {
        res.status(404).json({ error: 'Company profile not found' });
        return;
      }
      res.json(company);
    } catch (err) { next(err); }
  },

  async updateProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const data = UpdateProfileSchema.parse(req.body);
      const company = await companyService.updateProfile(req.user!.id, data);
      res.json(company);
    } catch (err) { next(err); }
  },

  async submitForApproval(req: Request, res: Response, next: NextFunction) {
    try {
      const company = await companyService.submitForApproval(req.user!.id);
      res.json({ message: 'Profile submitted for review', status: company.status });
    } catch (err) { next(err); }
  },

  async addService(req: Request, res: Response, next: NextFunction) {
    try {
      const data = ServiceSchema.parse(req.body);
      const service = await companyService.addService(req.user!.id, data);
      res.status(201).json(service);
    } catch (err) { next(err); }
  },

  async deleteService(req: Request, res: Response, next: NextFunction) {
    try {
      await companyService.deleteService(req.user!.id, req.params.serviceId);
      res.status(204).send();
    } catch (err) { next(err); }
  },

  // ── Public ──────────────────────────────────

  async search(req: Request, res: Response, next: NextFunction) {
    try {
      const {
        q, country, city, industryId, truvisVerified, truvisClient,
        tagSlug, featured, sortBy, page, limit,
      } = req.query as Record<string, string>;

      const result = await companyService.search({
        q,
        country,
        city,
        industryId,
        truvisVerified: truvisVerified === 'true' ? true : undefined,
        truvisClient: truvisClient === 'true' ? true : undefined,
        tagSlug,
        featured: featured === 'true' ? true : undefined,
        sortBy: sortBy as any,
        page: page ? parseInt(page) : undefined,
        limit: limit ? parseInt(limit) : undefined,
      });

      res.json(result);
    } catch (err) { next(err); }
  },

  async getPublicProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const company = await companyService.getPublicProfile(req.params.slug);
      if (!company) {
        res.status(404).json({ error: 'Company not found' });
        return;
      }
      res.json(company);
    } catch (err) { next(err); }
  },

  async contact(req: Request, res: Response, next: NextFunction) {
    try {
      const company = await companyService.getPublicProfile(req.params.slug);
      if (!company) {
        res.status(404).json({ error: 'Company not found' });
        return;
      }

      const data = ContactSchema.parse(req.body);

      // Save inquiry
      const { emailService } = await import('../services/email.service');
      const { config } = await import('../config');
      const prisma = (await import('../config/database')).default;

      await prisma.contactInquiry.create({
        data: {
          companyId: company.id,
          senderName: data.senderName,
          senderEmail: data.senderEmail,
          senderPhone: data.senderPhone,
          subject: data.subject,
          message: data.message,
          ipAddress: req.ip,
        },
      });

      // Update contact count
      await prisma.company.update({
        where: { id: company.id },
        data: { contactCount: { increment: 1 } },
      });

      // Send notifications
      if (company.email) {
        emailService
          .sendContactNotification(
            config.email.adminEmail,
            company.email,
            data.senderName,
            data.senderEmail,
            data.subject || '',
            data.message,
            company.name
          )
          .catch(() => {});
      }

      res.json({ message: 'Your message has been sent successfully.' });
    } catch (err) { next(err); }
  },
};
