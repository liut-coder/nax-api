import { getPagination, paged } from '../../shared/pagination.js';
import type { PermissionListQuery } from './permission.schema.js';
import { listPermissions } from './permission.repository.js';

export async function listPermissionsService(query: PermissionListQuery) {
  const pagination = getPagination(query);
  const result = await listPermissions({
    q: query.q,
    resource: query.resource,
    limit: pagination.limit,
    offset: pagination.offset,
  });
  return paged(result.items, result.total, pagination.page, pagination.pageSize);
}

