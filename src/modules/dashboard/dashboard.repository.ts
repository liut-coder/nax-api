import { and, count, desc, eq, gte } from 'drizzle-orm';
import { db } from '../../db/client.js';
import { auditLogs, files, roles, users } from '../../db/schema.js';

export async function getDashboardCounts() {
  const [[userCount], [activeUserCount], [roleCount], [fileCount]] = await Promise.all([
    db.select({ value: count() }).from(users),
    db.select({ value: count() }).from(users).where(eq(users.status, 'active')),
    db.select({ value: count() }).from(roles),
    db.select({ value: count() }).from(files),
  ]);
  return {
    users: userCount.value,
    activeUsers: activeUserCount.value,
    roles: roleCount.value,
    files: fileCount.value,
  };
}

export async function getRecentAuditLogs(limit = 10) {
  return db.query.auditLogs.findMany({
    limit,
    orderBy: [desc(auditLogs.createdAt)],
  });
}

export async function getRecentLoginCount(since: Date) {
  const [row] = await db
    .select({ value: count() })
    .from(auditLogs)
    .where(and(eq(auditLogs.resource, 'auth'), eq(auditLogs.action, 'login'), gte(auditLogs.createdAt, since)));
  return row.value;
}
