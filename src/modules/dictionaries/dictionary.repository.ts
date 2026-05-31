import { and, count, eq, gte, ilike, lte, or, sql } from 'drizzle-orm';
import { db } from '../../db/client.js';
import { dataDictionaries, dataDictionaryItems } from '../../db/schema.js';

export async function listDictionaries(input: {
  q?: string;
  enabled?: boolean;
  createdAtFrom?: Date;
  createdAtTo?: Date;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  limit: number;
  offset: number;
}) {
  const filters = [];
  if (input.q) filters.push(or(ilike(dataDictionaries.key, `%${input.q}%`), ilike(dataDictionaries.name, `%${input.q}%`)));
  if (input.enabled !== undefined) filters.push(eq(dataDictionaries.isEnabled, input.enabled));
  if (input.createdAtFrom) filters.push(gte(dataDictionaries.createdAt, input.createdAtFrom));
  if (input.createdAtTo) filters.push(lte(dataDictionaries.createdAt, input.createdAtTo));
  const where = filters.length > 0 ? and(...filters) : undefined;
  const sortColumn = input.sortBy === 'name' ? dataDictionaries.name : input.sortBy === 'createdAt' ? dataDictionaries.createdAt : dataDictionaries.key;
  const items = await db.query.dataDictionaries.findMany({
    where,
    limit: input.limit,
    offset: input.offset,
    orderBy: [input.sortOrder === 'asc' ? sql`${sortColumn} asc` : sql`${sortColumn} desc`],
  });
  const [{ value }] = await db.select({ value: count() }).from(dataDictionaries).where(where);
  return { items, total: value };
}

export async function getDictionary(id: string) {
  return db.query.dataDictionaries.findFirst({ where: eq(dataDictionaries.id, id) });
}

export async function getDictionaryByKey(key: string) {
  return db.query.dataDictionaries.findFirst({ where: eq(dataDictionaries.key, key) });
}

export async function getDictionaryItems(dictionaryId: string, enabledOnly = false) {
  const filters = [eq(dataDictionaryItems.dictionaryId, dictionaryId)];
  if (enabledOnly) filters.push(eq(dataDictionaryItems.isEnabled, true));
  return db.query.dataDictionaryItems.findMany({
    where: and(...filters),
    orderBy: (table, { asc }) => [asc(table.sortOrder), asc(table.label)],
  });
}

export async function createDictionary(input: {
  key: string;
  name: string;
  description: string;
  isEnabled: boolean;
}) {
  const [dictionary] = await db.insert(dataDictionaries).values(input).returning();
  return dictionary;
}

export async function updateDictionary(
  id: string,
  input: Partial<{
    name: string;
    description: string;
    isEnabled: boolean;
  }>,
) {
  const [dictionary] = await db
    .update(dataDictionaries)
    .set({ ...input, updatedAt: new Date() })
    .where(eq(dataDictionaries.id, id))
    .returning();
  return dictionary;
}

export async function deleteDictionary(id: string): Promise<void> {
  await db.delete(dataDictionaries).where(eq(dataDictionaries.id, id));
}

export async function getDictionaryItem(id: string) {
  return db.query.dataDictionaryItems.findFirst({ where: eq(dataDictionaryItems.id, id) });
}

export async function createDictionaryItem(input: {
  dictionaryId: string;
  label: string;
  value: string;
  color?: string | null;
  sortOrder: number;
  isEnabled: boolean;
  meta: Record<string, unknown>;
}) {
  const [item] = await db.insert(dataDictionaryItems).values(input).returning();
  return item;
}

export async function updateDictionaryItem(
  id: string,
  input: Partial<{
    label: string;
    value: string;
    color: string | null;
    sortOrder: number;
    isEnabled: boolean;
    meta: Record<string, unknown>;
  }>,
) {
  const [item] = await db
    .update(dataDictionaryItems)
    .set({ ...input, updatedAt: new Date() })
    .where(eq(dataDictionaryItems.id, id))
    .returning();
  return item;
}

export async function deleteDictionaryItem(id: string): Promise<void> {
  await db.delete(dataDictionaryItems).where(eq(dataDictionaryItems.id, id));
}
