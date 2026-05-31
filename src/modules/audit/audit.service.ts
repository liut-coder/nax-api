import { getPagination, getSort, paged } from '../../shared/pagination.js';
import { NotFoundError } from '../../shared/errors.js';
import type { AuditListQuery } from './audit.schema.js';
import { getAuditLog, listAuditLogs } from './audit.repository.js';

export async function listAuditLogsService(query: AuditListQuery) {
  const pagination = getPagination(query);
  const sort = getSort(query, ['createdAt']);
  const result = await listAuditLogs({
    actorUserId: query.actorUserId,
    resource: query.resource,
    action: query.action,
    createdAtFrom: query.createdAtFrom,
    createdAtTo: query.createdAtTo,
    sortBy: sort.sortBy,
    sortOrder: sort.sortOrder,
    limit: pagination.limit,
    offset: pagination.offset,
  });
  return paged(result.items, result.total, pagination.page, pagination.pageSize);
}

export async function getAuditLogService(id: string) {
  const log = await getAuditLog(id);
  if (!log) throw new NotFoundError('Audit log not found');
  return log;
}

export async function exportAuditLogsCsvService(query: AuditListQuery): Promise<string> {
  const result = await listAuditLogs({
    actorUserId: query.actorUserId,
    resource: query.resource,
    action: query.action,
    createdAtFrom: query.createdAtFrom,
    createdAtTo: query.createdAtTo,
    sortBy: 'createdAt',
    sortOrder: query.sortOrder,
    limit: 1000,
    offset: 0,
  });
  const rows = [
    ['id', 'actorUserId', 'action', 'resource', 'resourceId', 'ipAddress', 'createdAt'],
    ...result.items.map((item) => [
      item.id,
      item.actorUserId ?? '',
      item.action,
      item.resource,
      item.resourceId ?? '',
      item.ipAddress ?? '',
      item.createdAt.toISOString(),
    ]),
  ];
  return rows.map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(',')).join('\n');
}
