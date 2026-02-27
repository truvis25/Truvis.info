import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { z } from 'zod';
import prisma from '../config/database';
import redis from '../config/redis';
import { config } from '../config';
import { emailService } from './email.service';
import logger from '../utils/logger';

// ─────────────────────────────────────────
// VALIDATION SCHEMAS
// ─────────────────────────────────────────

export const RegisterSchema = z.object({
  email: z.string().email('Invalid email').max(255),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain uppercase letter')
    .regex(/[0-9]/, 'Must contain number')
    .max(100),
  companyName: z.string().min(2).max(255),
});

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const ForgotPasswordSchema = z.object({
  email: z.string().email(),
});

export const ResetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z
    .string()
    .min(8)
    .regex(/[A-Z]/)
    .regex(/[0-9]/),
});

// ─────────────────────────────────────────
// TOKEN HELPERS
// ─────────────────────────────────────────

function signAccessToken(userId: string, email: string, role: string): string {
  const payload = { sub: userId, email, role };
  if (config.jwt.privateKey && config.jwt.publicKey) {
    return jwt.sign(payload, config.jwt.privateKey, {
      algorithm: 'RS256',
      expiresIn: config.jwt.accessExpiry as any,
    });
  }
  return jwt.sign(payload, config.jwt.secret, {
    algorithm: 'HS256',
    expiresIn: config.jwt.accessExpiry as any,
  });
}

function generateRefreshToken(): string {
  return crypto.randomBytes(64).toString('hex');
}

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

// ─────────────────────────────────────────
// SERVICE METHODS
// ─────────────────────────────────────────

export const authService = {
  async register(data: z.infer<typeof RegisterSchema>, ipAddress?: string) {
    const { email, password, companyName } = data;

    // Check existing user
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      const err = new Error('Email already registered') as any;
      err.status = 409;
      throw err;
    }

    const passwordHash = await bcrypt.hash(password, config.security.bcryptRounds);
    const emailToken = crypto.randomBytes(32).toString('hex');
    const emailTokenExp = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h

    // Create user + company profile in transaction
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email,
          passwordHash,
          emailToken,
          emailTokenExp,
          role: 'company',
        },
      });

      // Build initial slug
      const { uniqueCompanySlug } = await import('../utils/slugify');
      const slug = await uniqueCompanySlug(companyName);

      const company = await tx.company.create({
        data: {
          userId: user.id,
          name: companyName,
          slug,
          status: 'draft',
        },
      });

      return { user, company };
    });

    // Send verification email (non-blocking)
    emailService
      .sendVerificationEmail(email, emailToken)
      .catch((err) => logger.error('[Auth] Email send failed', { err }));

    return { userId: result.user.id };
  },

  async verifyEmail(token: string) {
    const user = await prisma.user.findFirst({
      where: {
        emailToken: token,
        emailTokenExp: { gt: new Date() },
        emailVerified: false,
      },
    });

    if (!user) {
      const err = new Error('Invalid or expired verification token') as any;
      err.status = 400;
      throw err;
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        emailToken: null,
        emailTokenExp: null,
      },
    });

    return { email: user.email };
  },

  async login(data: z.infer<typeof LoginSchema>, ipAddress?: string) {
    const { email, password } = data;

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || !user.isActive) {
      const err = new Error('Invalid credentials') as any;
      err.status = 401;
      throw err;
    }

    if (!user.emailVerified) {
      const err = new Error('Please verify your email before logging in') as any;
      err.status = 403;
      throw err;
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      const err = new Error('Invalid credentials') as any;
      err.status = 401;
      throw err;
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const accessToken = signAccessToken(user.id, user.email, user.role);
    const refreshToken = generateRefreshToken();
    const refreshTokenHash = hashToken(refreshToken);

    // Store refresh token
    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: refreshTokenHash,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7d
        ipAddress,
      },
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    };
  },

  async refreshToken(token: string, ipAddress?: string) {
    const tokenHash = hashToken(token);

    const stored = await prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!stored || stored.revoked || stored.expiresAt < new Date()) {
      const err = new Error('Invalid or expired refresh token') as any;
      err.status = 401;
      throw err;
    }

    // Rotate: revoke old, issue new
    await prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revoked: true },
    });

    const newAccessToken = signAccessToken(stored.user.id, stored.user.email, stored.user.role);
    const newRefreshToken = generateRefreshToken();
    const newRefreshTokenHash = hashToken(newRefreshToken);

    await prisma.refreshToken.create({
      data: {
        userId: stored.user.id,
        tokenHash: newRefreshTokenHash,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        ipAddress,
      },
    });

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  },

  async logout(accessToken: string, refreshToken?: string) {
    // Blacklist access token in Redis (TTL = remaining token TTL)
    try {
      const decoded = jwt.decode(accessToken) as jwt.JwtPayload;
      if (decoded?.exp) {
        const ttl = decoded.exp - Math.floor(Date.now() / 1000);
        if (ttl > 0) {
          await redis.setex(`blacklist:${accessToken}`, ttl, '1');
        }
      }
    } catch {
      // Token might already be expired, that's fine
    }

    // Revoke refresh token if provided
    if (refreshToken) {
      const tokenHash = hashToken(refreshToken);
      await prisma.refreshToken.updateMany({
        where: { tokenHash },
        data: { revoked: true },
      });
    }
  },
};
