import { and, count, eq, gte, ilike, lte, or, sql } from 'drizzle-orm';
import { db } from '../../db/client.js';
import { permissions } from '../../db/schema.js';

export async function listPermissions(input: {
  q?: string;
  resource?: string;
  createdAtFrom?: Date;
  createdAtTo?: Date;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  limit: number;
  offset: number;
}) {
  const filters = [];
  if (input.resource) filters.push(eq(permissions.resource, input.resource));
  if (input.q) filters.push(or(ilike(permissions.key, `%${input.q}%`), ilike(permissions.description, `%${input.q}%`)));
  if (input.createdAtFrom) filters.push(gte(permissions.createdAt, input.createdAtFrom));
  if (input.createdAtTo) filters.push(lte(permissions.createdAt, input.createdAtTo));
  const where = filters.length > 0 ? and(...filters) : undefined;
  const sortColumn = input.sortBy === 'createdAt' ? permissions.createdAt : input.sortBy === 'resource' ? permissions.resource : permissions.key;
  const [items, [{ value }]] = await Promise.all([
    db.query.permissions.findMany({
      where,
      limit: input.limit,
      offset: input.offset,
      orderBy: [input.sortOrder === 'asc' ? sql`${sortColumn} asc` : sql`${sortColumn} desc`],
    }),
    db.select({ value: count() }).from(permissions).where(where),
  ]);
  return { items, total: value };
}
