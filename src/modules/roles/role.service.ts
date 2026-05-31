import type { FastifyRequest } from 'fastify';
import { ConflictError, ForbiddenError, NotFoundError } from '../../shared/errors.js';
import { getPagination, paged } from '../../shared/pagination.js';
import { writeAudit } from '../../shared/audit.js';
import type { CreateRoleBody, RoleListQuery, UpdateRoleBody } from './role.schema.js';
import {
  createRole,
  deleteRole,
  getRole,
  getRoleByKey,
  getRolePermissions,
  listRoles,
  replaceRolePermissions,
  updateRole,
} from './role.repository.js';

export async function listRolesService(query: RoleListQuery) {
  const pagination = getPagination(query);
  const result = await listRoles({ q: query.q, limit: pagination.limit, offset: pagination.offset });
  return paged(result.items, result.total, pagination.page, pagination.pageSize);
}

export async function getRoleService(id: string) {
  const role = await getRole(id);
  if (!role) throw new NotFoundError('Role not found');
  return { ...role, permissions: await getRolePermissions(id) };
}

export async function createRoleService(request: FastifyRequest, input: CreateRoleBody) {
  if (await getRoleByKey(input.key)) throw new ConflictError('Role key already exists');
  const role = await createRole({ key: input.key, name: input.name, description: input.description });
  if (input.permissionIds.length > 0) await replaceRolePermissions(role.id, input.permissionIds);
  await writeAudit(request, { action: 'create', resource: 'role', resourceId: role.id });
  return getRoleService(role.id);
}

export async function updateRoleService(request: FastifyRequest, id: string, input: UpdateRoleBody) {
  const role = await getRole(id);
  if (!role) throw new NotFoundError('Role not found');
  const updated = await updateRole(id, { name: input.name, description: input.description });
  if (!updated) throw new NotFoundError('Role not found');
  if (input.permissionIds) await replaceRolePermissions(id, input.permissionIds);
  await writeAudit(request, { action: 'update', resource: 'role', resourceId: id });
  return getRoleService(id);
}

export async function deleteRoleService(request: FastifyRequest, id: string) {
  const role = await getRole(id);
  if (!role) throw new NotFoundError('Role not found');
  if (role.isSystem) throw new ForbiddenError('System role cannot be deleted');
  await deleteRole(id);
  await writeAudit(request, { action: 'delete', resource: 'role', resourceId: id });
  return { deleted: true };
}

