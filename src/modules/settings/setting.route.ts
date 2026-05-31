import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { ok } from '../../shared/response.js';
import {
  settingListQuerySchema,
  upsertSettingBodySchema,
  type SettingListQuery,
  type UpsertSettingBody,
} from './setting.schema.js';
import { getSettingService, listSettingsService, upsertSettingService } from './setting.service.js';

const keyParams = z.object({ key: z.string().min(1) });
type KeyParams = z.infer<typeof keyParams>;

export async function settingRoutes(app: FastifyInstance): Promise<void> {
  app.get(
    '/',
    { preHandler: [app.authorize('setting:list')], schema: { tags: ['settings'], querystring: settingListQuerySchema } },
    async (request, reply) => ok(reply, request, await listSettingsService(request.query as SettingListQuery)),
  );
  app.get(
    '/:key',
    { preHandler: [app.authorize('setting:list')], schema: { tags: ['settings'], params: keyParams } },
    async (request, reply) => ok(reply, request, await getSettingService((request.params as KeyParams).key)),
  );
  app.put(
    '/:key',
    { preHandler: [app.authorize('setting:update')], schema: { tags: ['settings'], params: keyParams, body: upsertSettingBodySchema } },
    async (request, reply) =>
      ok(reply, request, await upsertSettingService(request, (request.params as KeyParams).key, request.body as UpsertSettingBody)),
  );
}
