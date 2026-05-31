import { and, count, eq, gte, ilike, lte, sql } from 'drizzle-orm';
import { db } from '../../db/client.js';
import { systemSettings } from '../../db/schema.js';

export async function listSettings(input: {
  q?: string;
  group?: string;
  publicOnly?: boolean;
  createdAtFrom?: Date;
  createdAtTo?: Date;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  limit: number;
  offset: number;
}) {
  const filters = [];
  if (input.q) filters.push(ilike(systemSettings.key, `%${input.q}%`));
  if (input.group) filters.push(eq(systemSettings.group, input.group));
  if (input.publicOnly) filters.push(eq(systemSettings.isPublic, true));
  if (input.createdAtFrom) filters.push(gte(systemSettings.createdAt, input.createdAtFrom));
  if (input.createdAtTo) filters.push(lte(systemSettings.createdAt, input.createdAtTo));
  const where = filters.length > 0 ? and(...filters) : undefined;
  const sortColumn = input.sortBy === 'group' ? systemSettings.group : input.sortBy === 'createdAt' ? systemSettings.createdAt : systemSettings.key;
  const items = await db.query.systemSettings.findMany({
    where,
    limit: input.limit,
    offset: input.offset,
    orderBy: [input.sortOrder === 'asc' ? sql`${sortColumn} asc` : sql`${sortColumn} desc`],
  });
  const [{ value }] = await db.select({ value: count() }).from(systemSettings).where(where);
  return { items, total: value };
}

export async function getSetting(key: string) {
  return db.query.systemSettings.findFirst({ where: eq(systemSettings.key, key) });
}

export async function upsertSetting(input: {
  key: string;
  value: unknown;
  group: string;
  type: string;
  isPublic: boolean;
  isEditable: boolean;
  description: string;
  updatedBy?: string;
}) {
  const [setting] = await db
    .insert(systemSettings)
    .values({
      key: input.key,
      value: input.value,
      group: input.group,
      type: input.type,
      isPublic: input.isPublic,
      isEditable: input.isEditable,
      description: input.description,
      updatedBy: input.updatedBy,
    })
    .onConflictDoUpdate({
      target: systemSettings.key,
      set: {
        value: input.value,
        group: input.group,
        type: input.type,
        isPublic: input.isPublic,
        isEditable: input.isEditable,
        description: input.description,
        updatedBy: input.updatedBy,
        updatedAt: new Date(),
      },
    })
    .returning();
  return setting;
}
