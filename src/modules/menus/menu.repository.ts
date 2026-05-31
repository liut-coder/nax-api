import { and, count, eq, gte, ilike, isNull, lte, or, sql } from 'drizzle-orm';
import { db } from '../../db/client.js';
import { menus } from '../../db/schema.js';

export async function listMenus(input: {
  q?: string;
  parentId?: string;
  visible?: boolean;
  enabled?: boolean;
  createdAtFrom?: Date;
  createdAtTo?: Date;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  limit: number;
  offset: number;
}) {
  const filters = [];
  if (input.q) filters.push(or(ilike(menus.key, `%${input.q}%`), ilike(menus.title, `%${input.q}%`)));
  if (input.parentId) filters.push(eq(menus.parentId, input.parentId));
  if (input.visible !== undefined) filters.push(eq(menus.isVisible, input.visible));
  if (input.enabled !== undefined) filters.push(eq(menus.isEnabled, input.enabled));
  if (input.createdAtFrom) filters.push(gte(menus.createdAt, input.createdAtFrom));
  if (input.createdAtTo) filters.push(lte(menus.createdAt, input.createdAtTo));
  const where = filters.length > 0 ? and(...filters) : undefined;
  const sortColumn =
    input.sortBy === 'title'
      ? menus.title
      : input.sortBy === 'sortOrder'
        ? menus.sortOrder
        : input.sortBy === 'createdAt'
          ? menus.createdAt
          : menus.key;
  const items = await db.query.menus.findMany({
    where,
    limit: input.limit,
    offset: input.offset,
    orderBy: [input.sortOrder === 'asc' ? sql`${sortColumn} asc` : sql`${sortColumn} desc`],
  });
  const [{ value }] = await db.select({ value: count() }).from(menus).where(where);
  return { items, total: value };
}

export async function listMenuTreeRows(enabledOnly = false) {
  const filters = [];
  if (enabledOnly) filters.push(eq(menus.isEnabled, true));
  return db.query.menus.findMany({
    where: filters.length > 0 ? and(...filters) : undefined,
    orderBy: (table, { asc }) => [asc(table.sortOrder), asc(table.title)],
  });
}

export async function getMenu(id: string) {
  return db.query.menus.findFirst({ where: eq(menus.id, id) });
}

export async function getMenuByKey(key: string) {
  return db.query.menus.findFirst({ where: eq(menus.key, key) });
}

export async function hasChildren(id: string): Promise<boolean> {
  const child = await db.query.menus.findFirst({ where: eq(menus.parentId, id), columns: { id: true } });
  return Boolean(child);
}

export async function createMenu(input: {
  parentId?: string | null;
  key: string;
  title: string;
  path?: string | null;
  icon?: string | null;
  permissionKey?: string | null;
  sortOrder: number;
  isVisible: boolean;
  isEnabled: boolean;
  meta: Record<string, unknown>;
}) {
  const [menu] = await db.insert(menus).values(input).returning();
  return menu;
}

export async function updateMenu(
  id: string,
  input: Partial<{
    parentId: string | null;
    title: string;
    path: string | null;
    icon: string | null;
    permissionKey: string | null;
    sortOrder: number;
    isVisible: boolean;
    isEnabled: boolean;
    meta: Record<string, unknown>;
  }>,
) {
  const [menu] = await db
    .update(menus)
    .set({ ...input, updatedAt: new Date() })
    .where(eq(menus.id, id))
    .returning();
  return menu;
}

export async function deleteMenu(id: string): Promise<void> {
  await db.delete(menus).where(eq(menus.id, id));
}

export async function getRootMenus() {
  return db.query.menus.findMany({
    where: isNull(menus.parentId),
    orderBy: (table, { asc }) => [asc(table.sortOrder), asc(table.title)],
  });
}
