import type { FastifyInstance } from 'fastify';
import { ok } from '../../shared/response.js';
import { getBaseInfoService } from './system.service.js';

export async function systemRoutes(app: FastifyInstance): Promise<void> {
  app.get(
    '/base-info',
    {
      schema: {
        tags: ['system'],
        summary: 'Public editable base information for frontend bootstrapping',
      },
    },
    async (request, reply) => ok(reply, request, await getBaseInfoService()),
  );
}
