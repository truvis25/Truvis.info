import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import prisma from '../config/database';
import redis from '../config/redis';
import { UserRole } from '@prisma/client';

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

/**
 * Verifies JWT and attaches user to request.
 */
export async function authenticate(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const token = authHeader.slice(7);

    // Check token blacklist (logout)
    const isBlacklisted = await redis.get(`blacklist:${token}`);
    if (isBlacklisted) {
      res.status(401).json({ error: 'Token revoked' });
      return;
    }

    let payload: jwt.JwtPayload;
    try {
      // Use RS256 if keys are configured, otherwise HS256 for dev
      if (config.jwt.privateKey && config.jwt.publicKey) {
        payload = jwt.verify(token, config.jwt.publicKey, { algorithms: ['RS256'] }) as jwt.JwtPayload;
      } else {
        payload = jwt.verify(token, config.jwt.secret, { algorithms: ['HS256'] }) as jwt.JwtPayload;
      }
    } catch {
      res.status(401).json({ error: 'Invalid or expired token' });
      return;
    }

    req.user = {
      id: payload.sub as string,
      email: payload.email as string,
      role: payload.role as UserRole,
    };

    next();
  } catch (err) {
    next(err);
  }
}

/**
 * Requires user to be authenticated.
 * Alias for authenticate — use when you want to be explicit.
 */
export const requireAuth = authenticate;

/**
 * Requires specific role(s). Must be used after authenticate.
 */
export function requireRole(...roles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }
    if (!roles.includes(req.user.role)) {
      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }
    next();
  };
}

export const isAdmin = requireRole('admin', 'super_admin');
export const isSuperAdmin = requireRole('super_admin');

/**
 * Checks that the authenticated user owns the company.
 */
export async function requireCompanyOwner(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    // Admins bypass ownership check
    if (req.user.role === 'admin' || req.user.role === 'super_admin') {
      next();
      return;
    }

    const companyId = req.params.companyId || req.params.id;
    if (!companyId) {
      res.status(400).json({ error: 'Company ID required' });
      return;
    }

    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: { userId: true },
    });

    if (!company) {
      res.status(404).json({ error: 'Company not found' });
      return;
    }

    if (company.userId !== req.user.id) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    next();
  } catch (err) {
    next(err);
  }
}
