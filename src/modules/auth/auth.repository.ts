import { and, desc, eq, gt, isNull, or } from 'drizzle-orm';
import { db } from '../../db/client.js';
import { menus, permissions, refreshTokens, rolePermissions, roles, userRoles, users } from '../../db/schema.js';

export async function findUserForLogin(account: string) {
  return db.query.users.findFirst({
    where: or(eq(users.email, account), eq(users.username, account)),
  });
}

export async function findUserById(userId: string) {
  return db.query.users.findFirst({
    where: eq(users.id, userId),
  });
}

export async function touchLastLogin(userId: string): Promise<void> {
  await db.update(users).set({ lastLoginAt: new Date(), updatedAt: new Date() }).where(eq(users.id, userId));
}

export async function updateCurrentUserProfile(userId: string, input: { displayName: string }) {
  const [user] = await db
    .update(users)
    .set({ displayName: input.displayName, updatedAt: new Date() })
    .where(eq(users.id, userId))
    .returning();
  return user;
}

export async function updateCurrentUserPassword(userId: string, passwordHash: string): Promise<void> {
  await db.update(users).set({ passwordHash, updatedAt: new Date() }).where(eq(users.id, userId));
}

export async function getUserPermissionKeys(userId: string): Promise<string[]> {
  const rows = await db
    .select({ key: permissions.key })
    .from(userRoles)
    .innerJoin(roles, eq(userRoles.roleId, roles.id))
    .innerJoin(rolePermissions, eq(rolePermissions.roleId, roles.id))
    .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
    .where(eq(userRoles.userId, userId));

  return [...new Set(rows.map((row) => row.key))];
}

export async function createRefreshToken(input: {
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  userAgent?: string;
  ipAddress?: string;
}) {
  const [token] = await db
    .insert(refreshTokens)
    .values({
      userId: input.userId,
      tokenHash: input.tokenHash,
      expiresAt: input.expiresAt,
      userAgent: input.userAgent,
      ipAddress: input.ipAddress,
    })
    .returning();
  return token;
}

export async function consumeActiveRefreshToken(tokenHash: string) {
  const now = new Date();
  const [token] = await db
    .update(refreshTokens)
    .set({ lastUsedAt: now, revokedAt: now })
    .where(and(eq(refreshTokens.tokenHash, tokenHash), isNull(refreshTokens.revokedAt), gt(refreshTokens.expiresAt, now)))
    .returning();
  return token;
}

export async function revokeRefreshToken(tokenHash: string): Promise<void> {
  await db.update(refreshTokens).set({ revokedAt: new Date() }).where(eq(refreshTokens.tokenHash, tokenHash));
}

export async function revokeUserRefreshTokens(userId: string): Promise<void> {
  await db
    .update(refreshTokens)
    .set({ revokedAt: new Date() })
    .where(and(eq(refreshTokens.userId, userId), isNull(refreshTokens.revokedAt)));
}

export async function listUserRefreshTokens(userId: string) {
  return db.query.refreshTokens.findMany({
    where: eq(refreshTokens.userId, userId),
    orderBy: [desc(refreshTokens.createdAt)],
  });
}

export async function getUserRefreshToken(userId: string, tokenId: string) {
  return db.query.refreshTokens.findFirst({
    where: and(eq(refreshTokens.userId, userId), eq(refreshTokens.id, tokenId)),
  });
}

export async function revokeRefreshTokenById(userId: string, tokenId: string): Promise<void> {
  await db
    .update(refreshTokens)
    .set({ revokedAt: new Date() })
    .where(and(eq(refreshTokens.userId, userId), eq(refreshTokens.id, tokenId), isNull(refreshTokens.revokedAt)));
}

export async function listEnabledMenus() {
  return db.query.menus.findMany({
    where: eq(menus.isEnabled, true),
    orderBy: (table, { asc }) => [asc(table.sortOrder), asc(table.title)],
  });
}
