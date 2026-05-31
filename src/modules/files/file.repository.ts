import { and, count, eq, gte, ilike, lte, sql } from 'drizzle-orm';
import { db } from '../../db/client.js';
import { files } from '../../db/schema.js';

export async function listFiles(input: {
  q?: string;
  category?: string;
  createdAtFrom?: Date;
  createdAtTo?: Date;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  limit: number;
  offset: number;
}) {
  const filters = [];
  if (input.q) filters.push(ilike(files.originalName, `%${input.q}%`));
  if (input.category) filters.push(eq(files.category, input.category));
  if (input.createdAtFrom) filters.push(gte(files.createdAt, input.createdAtFrom));
  if (input.createdAtTo) filters.push(lte(files.createdAt, input.createdAtTo));
  const where = filters.length > 0 ? and(...filters) : undefined;
  const sortColumn = input.sortBy === 'originalName' ? files.originalName : input.sortBy === 'sizeBytes' ? files.sizeBytes : files.createdAt;
  const [items, [{ value }]] = await Promise.all([
    db.query.files.findMany({
      where,
      limit: input.limit,
      offset: input.offset,
      orderBy: [input.sortOrder === 'asc' ? sql`${sortColumn} asc` : sql`${sortColumn} desc`],
    }),
    db.select({ value: count() }).from(files).where(where),
  ]);
  return { items, total: value };
}

export async function createFileRecord(input: {
  originalName: string;
  storedName: string;
  mimeType: string;
  sizeBytes: number;
  path: string;
  category: string;
  isPublic: boolean;
  uploadedBy?: string;
}) {
  const [file] = await db.insert(files).values(input).returning();
  return file;
}

export async function getFile(id: string) {
  return db.query.files.findFirst({ where: eq(files.id, id) });
}

export async function getPublicFile(id: string) {
  return db.query.files.findFirst({ where: and(eq(files.id, id), eq(files.isPublic, true)) });
}

export async function deleteFile(id: string): Promise<void> {
  await db.delete(files).where(eq(files.id, id));
}
