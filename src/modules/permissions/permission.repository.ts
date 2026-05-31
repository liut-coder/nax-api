import { and, count, eq, ilike, or } from 'drizzle-orm';
import { db } from '../../db/client.js';
import { permissions } from '../../db/schema.js';

export async function listPermissions(input: { q?: string; resource?: string; limit: number; offset: number }) {
  const filters = [];
  if (input.resource) filters.push(eq(permissions.resource, input.resource));
  if (input.q) filters.push(or(ilike(permissions.key, `%${input.q}%`), ilike(permissions.description, `%${input.q}%`)));
  const where = filters.length > 0 ? and(...filters) : undefined;
  const items = await db.query.permissions.findMany({
    where,
    limit: input.limit,
    offset: input.offset,
    orderBy: (table, { asc }) => [asc(table.resource), asc(table.action)],
  });
  const [{ value }] = await db.select({ value: count() }).from(permissions).where(where);
  return { items, total: value };
}

