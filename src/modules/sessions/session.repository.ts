import { and, count, eq, gt, gte, ilike, isNull, isNotNull, lte, or, sql } from 'drizzle-orm';
import { db } from '../../db/client.js';
import { refreshTokens, users } from '../../db/schema.js';

export async function listSessions(input: {
  q?: string;
  userId?: string;
  active?: boolean;
  createdAtFrom?: Date;
  createdAtTo?: Date;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  limit: number;
  offset: number;
}) {
  const filters = [];
  if (input.userId) filters.push(eq(refreshTokens.userId, input.userId));
  if (input.createdAtFrom) filters.push(gte(refreshTokens.createdAt, input.createdAtFrom));
  if (input.createdAtTo) filters.push(lte(refreshTokens.createdAt, input.createdAtTo));
  if (input.active === true) filters.push(and(isNull(refreshTokens.revokedAt), gt(refreshTokens.expiresAt, new Date())));
  if (input.active === false) filters.push(or(isNotNull(refreshTokens.revokedAt), lte(refreshTokens.expiresAt, new Date())));

  const joinFilters = [...filters];
  if (input.q) {
    joinFilters.push(
      or(
        ilike(users.email, `%${input.q}%`),
        ilike(users.username, `%${input.q}%`),
        ilike(refreshTokens.ipAddress, `%${input.q}%`),
        ilike(refreshTokens.userAgent, `%${input.q}%`),
      ),
    );
  }

  const where = joinFilters.length > 0 ? and(...joinFilters) : undefined;
  const sortColumn =
    input.sortBy === 'expiresAt'
      ? refreshTokens.expiresAt
      : input.sortBy === 'lastUsedAt'
        ? refreshTokens.lastUsedAt
        : refreshTokens.createdAt;

  const [items, [{ value }]] = await Promise.all([
    db
      .select({
        id: refreshTokens.id,
        userId: refreshTokens.userId,
        userAgent: refreshTokens.userAgent,
        ipAddress: refreshTokens.ipAddress,
        expiresAt: refreshTokens.expiresAt,
        revokedAt: refreshTokens.revokedAt,
        lastUsedAt: refreshTokens.lastUsedAt,
        createdAt: refreshTokens.createdAt,
        userEmail: users.email,
        username: users.username,
        displayName: users.displayName,
      })
      .from(refreshTokens)
      .innerJoin(users, eq(refreshTokens.userId, users.id))
      .where(where)
      .orderBy(input.sortOrder === 'asc' ? sql`${sortColumn} asc` : sql`${sortColumn} desc`)
      .limit(input.limit)
      .offset(input.offset),
    db.select({ value: count() }).from(refreshTokens).innerJoin(users, eq(refreshTokens.userId, users.id)).where(where),
  ]);
  return { items, total: value };
}

export async function getSession(id: string) {
  return db.query.refreshTokens.findFirst({ where: eq(refreshTokens.id, id) });
}

export async function revokeSession(id: string): Promise<void> {
  await db.update(refreshTokens).set({ revokedAt: new Date() }).where(eq(refreshTokens.id, id));
}
