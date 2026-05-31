import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { created, ok } from '../../shared/response.js';
import {
  createUserBodySchema,
  updateUserBodySchema,
  userListQuerySchema,
  type CreateUserBody,
  type UpdateUserBody,
  type UserListQuery,
} from './user.schema.js';
import { createUserService, deleteUserService, getUserService, listUsersService, updateUserService } from './user.service.js';

const idParams = z.object({ id: z.string().uuid() });
type IdParams = z.infer<typeof idParams>;

export async function userRoutes(app: FastifyInstance): Promise<void> {
  app.get(
    '/',
    { preHandler: [app.authorize('user:list')], schema: { tags: ['users'], querystring: userListQuerySchema } },
    async (request, reply) => ok(reply, request, await listUsersService(request.query as UserListQuery)),
  );
  app.get(
    '/:id',
    { preHandler: [app.authorize('user:read')], schema: { tags: ['users'], params: idParams } },
    async (request, reply) => ok(reply, request, await getUserService((request.params as IdParams).id)),
  );
  app.post(
    '/',
    { preHandler: [app.authorize('user:create')], schema: { tags: ['users'], body: createUserBodySchema } },
    async (request, reply) => created(reply, request, await createUserService(request, request.body as CreateUserBody)),
  );
  app.patch(
    '/:id',
    { preHandler: [app.authorize('user:update')], schema: { tags: ['users'], params: idParams, body: updateUserBodySchema } },
    async (request, reply) =>
      ok(reply, request, await updateUserService(request, (request.params as IdParams).id, request.body as UpdateUserBody)),
  );
  app.delete(
    '/:id',
    { preHandler: [app.authorize('user:delete')], schema: { tags: ['users'], params: idParams } },
    async (request, reply) => ok(reply, request, await deleteUserService(request, (request.params as IdParams).id)),
  );
}
