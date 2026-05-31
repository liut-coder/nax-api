import { and, count, eq, gte, ilike, lte, or, sql } from 'drizzle-orm';
import { db } from '../../db/client.js';
import { roles, userRoles, users } from '../../db/schema.js';

export async function listUsers(input: {
  q?: string;
  status?: string;
  createdAtFrom?: Date;
  createdAtTo?: Date;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  limit: number;
  offset: number;
}) {
  const filters = [];
  if (input.q) {
    filters.push(or(ilike(users.email, `%${input.q}%`), ilike(users.username, `%${input.q}%`), ilike(users.displayName, `%${input.q}%`)));
  }
  if (input.status) filters.push(eq(users.status, input.status));
  if (input.createdAtFrom) filters.push(gte(users.createdAt, input.createdAtFrom));
  if (input.createdAtTo) filters.push(lte(users.createdAt, input.createdAtTo));
  const where = filters.length > 0 ? and(...filters) : undefined;
  const sortColumn = input.sortBy === 'username' ? users.username : input.sortBy === 'email' ? users.email : users.createdAt;
  const [items, [{ value }]] = await Promise.all([
    db.query.users.findMany({
      where,
      limit: input.limit,
      offset: input.offset,
      orderBy: [input.sortOrder === 'asc' ? sql`${sortColumn} asc` : sql`${sortColumn} desc`],
    }),
    db.select({ value: count() }).from(users).where(where),
  ]);
  return { items, total: value };
}

export async function getUser(id: string) {
  return db.query.users.findFirst({
    where: eq(users.id, id),
  });
}

export async function getUserRoles(id: string) {
  return db
    .select({ id: roles.id, key: roles.key, name: roles.name })
    .from(userRoles)
    .innerJoin(roles, eq(userRoles.roleId, roles.id))
    .where(eq(userRoles.userId, id));
}

export async function findUserByEmailOrUsername(email: string, username: string) {
  return db.query.users.findFirst({
    where: or(eq(users.email, email), eq(users.username, username)),
  });
}

export async function createUser(input: {
  email: string;
  username: string;
  displayName: string;
  passwordHash: string;
  status: string;
}) {
  const [user] = await db.insert(users).values(input).returning();
  return user;
}

export async function updateUser(
  id: string,
  input: Partial<{
    email: string;
    username: string;
    displayName: string;
    passwordHash: string;
    status: string;
    isActive: boolean;
  }>,
) {
  const [user] = await db
    .update(users)
    .set({ ...input, updatedAt: new Date() })
    .where(eq(users.id, id))
    .returning();
  return user;
}

export async function deleteUser(id: string): Promise<void> {
  await db.delete(users).where(eq(users.id, id));
}

export async function replaceUserRoles(userId: string, roleIds: string[]): Promise<void> {
  await db.transaction(async (tx) => {
    await tx.delete(userRoles).where(eq(userRoles.userId, userId));
    if (roleIds.length > 0) {
      await tx.insert(userRoles).values(roleIds.map((roleId) => ({ userId, roleId })));
    }
  });
}
