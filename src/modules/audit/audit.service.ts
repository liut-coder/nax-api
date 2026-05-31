import { getPagination, paged } from '../../shared/pagination.js';
import type { AuditListQuery } from './audit.schema.js';
import { listAuditLogs } from './audit.repository.js';

export async function listAuditLogsService(query: AuditListQuery) {
  const pagination = getPagination(query);
  const result = await listAuditLogs({
    actorUserId: query.actorUserId,
    resource: query.resource,
    action: query.action,
    limit: pagination.limit,
    offset: pagination.offset,
  });
  return paged(result.items, result.total, pagination.page, pagination.pageSize);
}

