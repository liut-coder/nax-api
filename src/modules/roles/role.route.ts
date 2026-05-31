import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { created, ok } from '../../shared/response.js';
import {
  createRoleBodySchema,
  roleListQuerySchema,
  updateRoleBodySchema,
  type CreateRoleBody,
  type RoleListQuery,
  type UpdateRoleBody,
} from './role.schema.js';
import { createRoleService, deleteRoleService, getRoleService, listRolesService, updateRoleService } from './role.service.js';

const idParams = z.object({ id: z.string().uuid() });
type IdParams = z.infer<typeof idParams>;

export async function roleRoutes(app: FastifyInstance): Promise<void> {
  app.get(
    '/',
    { preHandler: [app.authorize('role:list')], schema: { tags: ['roles'], querystring: roleListQuerySchema } },
    async (request, reply) => ok(reply, request, await listRolesService(request.query as RoleListQuery)),
  );
  app.get(
    '/:id',
    { preHandler: [app.authorize('role:read')], schema: { tags: ['roles'], params: idParams } },
    async (request, reply) => ok(reply, request, await getRoleService((request.params as IdParams).id)),
  );
  app.post(
    '/',
    { preHandler: [app.authorize('role:create')], schema: { tags: ['roles'], body: createRoleBodySchema } },
    async (request, reply) => created(reply, request, await createRoleService(request, request.body as CreateRoleBody)),
  );
  app.patch(
    '/:id',
    { preHandler: [app.authorize('role:update')], schema: { tags: ['roles'], params: idParams, body: updateRoleBodySchema } },
    async (request, reply) =>
      ok(reply, request, await updateRoleService(request, (request.params as IdParams).id, request.body as UpdateRoleBody)),
  );
  app.delete(
    '/:id',
    { preHandler: [app.authorize('role:delete')], schema: { tags: ['roles'], params: idParams } },
    async (request, reply) => ok(reply, request, await deleteRoleService(request, (request.params as IdParams).id)),
  );
}
