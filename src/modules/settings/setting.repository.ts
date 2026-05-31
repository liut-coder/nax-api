import { count, eq, ilike } from 'drizzle-orm';
import { db } from '../../db/client.js';
import { systemSettings } from '../../db/schema.js';

export async function listSettings(input: { q?: string; limit: number; offset: number }) {
  const where = input.q ? ilike(systemSettings.key, `%${input.q}%`) : undefined;
  const items = await db.query.systemSettings.findMany({
    where,
    limit: input.limit,
    offset: input.offset,
    orderBy: (table, { asc }) => [asc(table.key)],
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
  description: string;
  updatedBy?: string;
}) {
  const [setting] = await db
    .insert(systemSettings)
    .values({
      key: input.key,
      value: input.value,
      description: input.description,
      updatedBy: input.updatedBy,
    })
    .onConflictDoUpdate({
      target: systemSettings.key,
      set: {
        value: input.value,
        description: input.description,
        updatedBy: input.updatedBy,
        updatedAt: new Date(),
      },
    })
    .returning();
  return setting;
}

