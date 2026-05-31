import { and, count, eq, gte, lte, sql } from 'drizzle-orm';
import { db } from '../../db/client.js';
import { auditLogs } from '../../db/schema.js';

export async function listAuditLogs(input: {
  actorUserId?: string;
  resource?: string;
  action?: string;
  createdAtFrom?: Date;
  createdAtTo?: Date;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  limit: number;
  offset: number;
}) {
  const filters = [];
  if (input.actorUserId) filters.push(eq(auditLogs.actorUserId, input.actorUserId));
  if (input.resource) filters.push(eq(auditLogs.resource, input.resource));
  if (input.action) filters.push(eq(auditLogs.action, input.action));
  if (input.createdAtFrom) filters.push(gte(auditLogs.createdAt, input.createdAtFrom));
  if (input.createdAtTo) filters.push(lte(auditLogs.createdAt, input.createdAtTo));
  const where = filters.length > 0 ? and(...filters) : undefined;
  const sortColumn = auditLogs.createdAt;
  const items = await db.query.auditLogs.findMany({
    where,
    limit: input.limit,
    offset: input.offset,
    orderBy: [input.sortOrder === 'asc' ? sql`${sortColumn} asc` : sql`${sortColumn} desc`],
  });
  const [{ value }] = await db.select({ value: count() }).from(auditLogs).where(where);
  return { items, total: value };
}

export async function getAuditLog(id: string) {
  return db.query.auditLogs.findFirst({ where: eq(auditLogs.id, id) });
}
