import type { FastifyInstance } from 'fastify';
import { ok } from '../../shared/response.js';
import { permissionListQuerySchema, type PermissionListQuery } from './permission.schema.js';
import { listPermissionsService } from './permission.service.js';

export async function permissionRoutes(app: FastifyInstance): Promise<void> {
  app.get(
    '/',
    { preHandler: [app.authorize('permission:list')], schema: { tags: ['permissions'], querystring: permissionListQuerySchema } },
    async (request, reply) => ok(reply, request, await listPermissionsService(request.query as PermissionListQuery)),
  );
}
