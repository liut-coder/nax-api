import { count, ilike } from 'drizzle-orm';
import { db } from '../../db/client.js';
import { files } from '../../db/schema.js';

export async function listFiles(input: { q?: string; limit: number; offset: number }) {
  const where = input.q ? ilike(files.originalName, `%${input.q}%`) : undefined;
  const items = await db.query.files.findMany({
    where,
    limit: input.limit,
    offset: input.offset,
    orderBy: (table, { desc }) => [desc(table.createdAt)],
  });
  const [{ value }] = await db.select({ value: count() }).from(files).where(where);
  return { items, total: value };
}

export async function createFileRecord(input: {
  originalName: string;
  storedName: string;
  mimeType: string;
  sizeBytes: number;
  path: string;
  uploadedBy?: string;
}) {
  const [file] = await db.insert(files).values(input).returning();
  return file;
}

