import type { FastifyInstance } from 'fastify';
import { ok } from '../../shared/response.js';
import { getDashboardOverviewService } from './dashboard.service.js';

export async function dashboardRoutes(app: FastifyInstance): Promise<void> {
  app.get(
    '/overview',
    {
      preHandler: [app.authorize('dashboard:read')],
      schema: { tags: ['dashboard'], summary: 'Dashboard overview', security: [{ bearerAuth: [] }] },
    },
    async (request, reply) => ok(reply, request, await getDashboardOverviewService()),
  );
}
