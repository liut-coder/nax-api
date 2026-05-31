import type { FastifyRequest } from 'fastify';
import { db } from '../db/client.js';
import { auditLogs } from '../db/schema.js';

export async function writeAudit(
  request: FastifyRequest,
  input: {
    action: string;
    resource: string;
    resourceId?: string | null;
    metadata?: Record<string, unknown>;
  },
): Promise<void> {
  await db.insert(auditLogs).values({
    actorUserId: request.auth?.userId,
    action: input.action,
    resource: input.resource,
    resourceId: input.resourceId ?? null,
    ipAddress: request.ip,
    userAgent: request.headers['user-agent'],
    metadata: input.metadata ?? {},
  });
}

