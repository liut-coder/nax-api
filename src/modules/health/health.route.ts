import type { FastifyInstance } from 'fastify';
import { ok } from '../../shared/response.js';
import { getHealth } from './health.service.js';

export async function healthRoutes(app: FastifyInstance): Promise<void> {
  app.get(
    '/',
    {
      schema: {
        tags: ['health'],
        summary: 'Health check',
      },
    },
    async (request, reply) => {
      return ok(reply, request, await getHealth());
    },
  );
}

