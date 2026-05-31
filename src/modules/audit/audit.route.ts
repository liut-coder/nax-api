import type { FastifyInstance } from 'fastify';
import { ok } from '../../shared/response.js';
import { auditListQuerySchema, type AuditListQuery } from './audit.schema.js';
import { listAuditLogsService } from './audit.service.js';

export async function auditRoutes(app: FastifyInstance): Promise<void> {
  app.get(
    '/',
    { preHandler: [app.authorize('audit:list')], schema: { tags: ['audit'], querystring: auditListQuerySchema } },
    async (request, reply) => ok(reply, request, await listAuditLogsService(request.query as AuditListQuery)),
  );
}
