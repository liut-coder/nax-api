import { and, count, eq } from 'drizzle-orm';
import { db } from '../../db/client.js';
import { auditLogs } from '../../db/schema.js';

export async function listAuditLogs(input: {
  actorUserId?: string;
  resource?: string;
  action?: string;
  limit: number;
  offset: number;
}) {
  const filters = [];
  if (input.actorUserId) filters.push(eq(auditLogs.actorUserId, input.actorUserId));
  if (input.resource) filters.push(eq(auditLogs.resource, input.resource));
  if (input.action) filters.push(eq(auditLogs.action, input.action));
  const where = filters.length > 0 ? and(...filters) : undefined;
  const items = await db.query.auditLogs.findMany({
    where,
    limit: input.limit,
    offset: input.offset,
    orderBy: (table, { desc }) => [desc(table.createdAt)],
  });
  const [{ value }] = await db.select({ value: count() }).from(auditLogs).where(where);
  return { items, total: value };
}

