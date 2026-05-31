import type { FastifyRequest } from 'fastify';
import { NotFoundError } from '../../shared/errors.js';
import { getPagination, getSort, paged } from '../../shared/pagination.js';
import { writeAudit } from '../../shared/audit.js';
import type { SessionListQuery } from './session.schema.js';
import { getSession, listSessions, revokeSession } from './session.repository.js';

export async function listSessionsService(query: SessionListQuery) {
  const pagination = getPagination(query);
  const sort = getSort(query, ['createdAt', 'expiresAt', 'lastUsedAt']);
  const result = await listSessions({
    q: query.q,
    userId: query.userId,
    active: query.active,
    createdAtFrom: query.createdAtFrom,
    createdAtTo: query.createdAtTo,
    sortBy: sort.sortBy,
    sortOrder: sort.sortOrder,
    limit: pagination.limit,
    offset: pagination.offset,
  });
  return paged(
    result.items.map((session) => ({
      ...session,
      isActive: !session.revokedAt && session.expiresAt > new Date(),
    })),
    result.total,
    pagination.page,
    pagination.pageSize,
  );
}

export async function revokeSessionService(request: FastifyRequest, id: string) {
  const session = await getSession(id);
  if (!session) throw new NotFoundError('Session not found');
  await revokeSession(id);
  await writeAudit(request, { action: 'revoke', resource: 'session', resourceId: id, metadata: { userId: session.userId } });
  return { revoked: true };
}
