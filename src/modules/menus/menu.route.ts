import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { created, ok } from '../../shared/response.js';
import {
  createMenuBodySchema,
  menuListQuerySchema,
  updateMenuBodySchema,
  type CreateMenuBody,
  type MenuListQuery,
  type UpdateMenuBody,
} from './menu.schema.js';
import {
  createMenuService,
  deleteMenuService,
  getMenuService,
  listMenusService,
  menuTreeService,
  updateMenuService,
} from './menu.service.js';

const idParams = z.object({ id: z.string().uuid() });
type IdParams = z.infer<typeof idParams>;

export async function menuRoutes(app: FastifyInstance): Promise<void> {
  app.get(
    '/',
    { preHandler: [app.authorize('menu:list')], schema: { tags: ['menus'], querystring: menuListQuerySchema } },
    async (request, reply) => ok(reply, request, await listMenusService(request.query as MenuListQuery)),
  );

  app.get(
    '/tree',
    { preHandler: [app.authorize('menu:list')], schema: { tags: ['menus'] } },
    async (request, reply) => ok(reply, request, await menuTreeService()),
  );

  app.get(
    '/:id',
    { preHandler: [app.authorize('menu:list')], schema: { tags: ['menus'], params: idParams } },
    async (request, reply) => ok(reply, request, await getMenuService((request.params as IdParams).id)),
  );

  app.post(
    '/',
    { preHandler: [app.authorize('menu:create')], schema: { tags: ['menus'], body: createMenuBodySchema } },
    async (request, reply) => created(reply, request, await createMenuService(request, request.body as CreateMenuBody)),
  );

  app.patch(
    '/:id',
    { preHandler: [app.authorize('menu:update')], schema: { tags: ['menus'], params: idParams, body: updateMenuBodySchema } },
    async (request, reply) =>
      ok(reply, request, await updateMenuService(request, (request.params as IdParams).id, request.body as UpdateMenuBody)),
  );

  app.delete(
    '/:id',
    { preHandler: [app.authorize('menu:delete')], schema: { tags: ['menus'], params: idParams } },
    async (request, reply) => ok(reply, request, await deleteMenuService(request, (request.params as IdParams).id)),
  );
}
