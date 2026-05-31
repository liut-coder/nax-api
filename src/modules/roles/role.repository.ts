import { and, count, eq, gte, ilike, lte, or, sql } from 'drizzle-orm';
import { db } from '../../db/client.js';
import { permissions, rolePermissions, roles } from '../../db/schema.js';

export async function listRoles(input: {
  q?: string;
  createdAtFrom?: Date;
  createdAtTo?: Date;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  limit: number;
  offset: number;
}) {
  const filters = [];
  if (input.q) filters.push(or(ilike(roles.key, `%${input.q}%`), ilike(roles.name, `%${input.q}%`)));
  if (input.createdAtFrom) filters.push(gte(roles.createdAt, input.createdAtFrom));
  if (input.createdAtTo) filters.push(lte(roles.createdAt, input.createdAtTo));
  const where = filters.length > 0 ? and(...filters) : undefined;
  const sortColumn = input.sortBy === 'name' ? roles.name : input.sortBy === 'createdAt' ? roles.createdAt : roles.key;
  const items = await db.query.roles.findMany({
    where,
    limit: input.limit,
    offset: input.offset,
    orderBy: [input.sortOrder === 'asc' ? sql`${sortColumn} asc` : sql`${sortColumn} desc`],
  });
  const [{ value }] = await db.select({ value: count() }).from(roles).where(where);
  return { items, total: value };
}

export async function getRole(id: string) {
  return db.query.roles.findFirst({ where: eq(roles.id, id) });
}

export async function getRoleByKey(key: string) {
  return db.query.roles.findFirst({ where: eq(roles.key, key) });
}

export async function getRolePermissions(roleId: string) {
  return db
    .select({ id: permissions.id, key: permissions.key, resource: permissions.resource, action: permissions.action })
    .from(rolePermissions)
    .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
    .where(eq(rolePermissions.roleId, roleId));
}

export async function createRole(input: { key: string; name: string; description: string }) {
  const [role] = await db.insert(roles).values(input).returning();
  return role;
}

export async function updateRole(id: string, input: { name?: string; description?: string }) {
  const [role] = await db
    .update(roles)
    .set({ ...input, updatedAt: new Date() })
    .where(eq(roles.id, id))
    .returning();
  return role;
}

export async function deleteRole(id: string): Promise<void> {
  await db.delete(roles).where(eq(roles.id, id));
}

export async function replaceRolePermissions(roleId: string, permissionIds: string[]): Promise<void> {
  await db.transaction(async (tx) => {
    await tx.delete(rolePermissions).where(eq(rolePermissions.roleId, roleId));
    if (permissionIds.length > 0) {
      await tx.insert(rolePermissions).values(permissionIds.map((permissionId) => ({ roleId, permissionId })));
    }
  });
}
