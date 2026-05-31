import { getPagination, getSort, paged } from '../../shared/pagination.js';
import type { PermissionListQuery } from './permission.schema.js';
import { listPermissions } from './permission.repository.js';

export async function listPermissionsService(query: PermissionListQuery) {
  const pagination = getPagination(query);
  const sort = getSort(query, ['key', 'resource', 'createdAt'], 'key');
  const result = await listPermissions({
    q: query.q,
    resource: query.resource,
    createdAtFrom: query.createdAtFrom,
    createdAtTo: query.createdAtTo,
    sortBy: sort.sortBy,
    sortOrder: sort.sortOrder,
    limit: pagination.limit,
    offset: pagination.offset,
  });
  return paged(result.items, result.total, pagination.page, pagination.pageSize);
}
