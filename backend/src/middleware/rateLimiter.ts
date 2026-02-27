import rateLimit from 'express-rate-limit';
import { config } from '../config';

const createLimiter = (max: number, windowMs = config.rateLimit.windowMs, message?: string) =>
  rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: message || 'Too many requests, please try again later.' },
    skip: (req) => req.ip === '127.0.0.1' && config.env === 'development',
  });

export const generalLimiter = createLimiter(config.rateLimit.max);

export const authLimiter = createLimiter(
  config.rateLimit.authMax,
  15 * 60 * 1000,
  'Too many authentication attempts. Please try again in 15 minutes.'
);

export const uploadLimiter = createLimiter(
  config.rateLimit.uploadMax,
  60 * 60 * 1000,
  'Upload limit reached. Please try again in 1 hour.'
);

export const contactLimiter = createLimiter(
  config.rateLimit.contactMax,
  60 * 60 * 1000,
  'Too many contact requests. Please try again in 1 hour.'
);

export const strictLimiter = createLimiter(3, 60 * 60 * 1000);
