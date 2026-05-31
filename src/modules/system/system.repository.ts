import { and, eq } from 'drizzle-orm';
import { db } from '../../db/client.js';
import { systemSettings } from '../../db/schema.js';

export async function listPublicBaseSettings() {
  return db.query.systemSettings.findMany({
    where: and(eq(systemSettings.group, 'base'), eq(systemSettings.isPublic, true)),
    orderBy: (table, { asc }) => [asc(table.key)],
  });
}
