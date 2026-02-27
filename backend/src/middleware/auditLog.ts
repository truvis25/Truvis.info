import { Request, Response, NextFunction } from 'express';
import prisma from '../config/database';
import logger from '../utils/logger';

export interface AuditEntry {
  action: string;
  entityType?: string;
  entityId?: string;
  oldValues?: object;
  newValues?: object;
}

export async function createAuditLog(
  req: Request,
  entry: AuditEntry
): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId: req.user?.id,
        action: entry.action,
        entityType: entry.entityType,
        entityId: entry.entityId,
        oldValues: entry.oldValues as any,
        newValues: entry.newValues as any,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      },
    });
  } catch (err) {
    logger.error('[AuditLog] Failed to write audit log', { err, entry });
  }
}
