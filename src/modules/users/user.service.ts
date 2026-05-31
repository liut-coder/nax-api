import type { FastifyRequest } from 'fastify';
import { ConflictError, NotFoundError } from '../../shared/errors.js';
import { hashPassword } from '../../shared/password.js';
import { getPagination, paged } from '../../shared/pagination.js';
import { writeAudit } from '../../shared/audit.js';
import type { CreateUserBody, UpdateUserBody, UserListQuery } from './user.schema.js';
import {
  createUser as insertUser,
  deleteUser as removeUser,
  findUserByEmailOrUsername,
  getUser,
  getUserRoles,
  listUsers,
  replaceUserRoles,
  updateUser as patchUser,
} from './user.repository.js';

function sanitizeUser(user: NonNullable<Awaited<ReturnType<typeof getUser>>>) {
  const { passwordHash: _passwordHash, ...safe } = user;
  return safe;
}

export async function listUsersService(query: UserListQuery) {
  const pagination = getPagination(query);
  const result = await listUsers({ q: query.q, limit: pagination.limit, offset: pagination.offset });
  return paged(result.items.map(sanitizeUser), result.total, pagination.page, pagination.pageSize);
}

export async function getUserService(id: string) {
  const user = await getUser(id);
  if (!user) throw new NotFoundError('User not found');
  return { ...sanitizeUser(user), roles: await getUserRoles(id) };
}

export async function createUserService(request: FastifyRequest, input: CreateUserBody) {
  const existing = await findUserByEmailOrUsername(input.email, input.username);
  if (existing) throw new ConflictError('Email or username already exists');
  const user = await insertUser({
    email: input.email,
    username: input.username,
    displayName: input.displayName,
    passwordHash: await hashPassword(input.password),
  });
  if (input.roleIds.length > 0) await replaceUserRoles(user.id, input.roleIds);
  await writeAudit(request, { action: 'create', resource: 'user', resourceId: user.id });
  return getUserService(user.id);
}

export async function updateUserService(request: FastifyRequest, id: string, input: UpdateUserBody) {
  const user = await getUser(id);
  if (!user) throw new NotFoundError('User not found');
  const updated = await patchUser(id, {
    email: input.email,
    username: input.username,
    displayName: input.displayName,
    isActive: input.isActive,
    passwordHash: input.password ? await hashPassword(input.password) : undefined,
  });
  if (!updated) throw new NotFoundError('User not found');
  if (input.roleIds) await replaceUserRoles(id, input.roleIds);
  await writeAudit(request, { action: 'update', resource: 'user', resourceId: id });
  return getUserService(id);
}

export async function deleteUserService(request: FastifyRequest, id: string) {
  const user = await getUser(id);
  if (!user) throw new NotFoundError('User not found');
  await removeUser(id);
  await writeAudit(request, { action: 'delete', resource: 'user', resourceId: id });
  return { deleted: true };
}

