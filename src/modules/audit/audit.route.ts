import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { looseEntitySchema, pagedResponseSchema, successResponseSchema } from '../../shared/openapi.js';
import { ok } from '../../shared/response.js';
import { auditListQuerySchema, type AuditListQuery } from './audit.schema.js';
import { exportAuditLogsCsvService, getAuditLogService, listAuditLogsService } from './audit.service.js';

const idParams = z.object({ id: z.string().uuid() });
type IdParams = z.infer<typeof idParams>;

export async function auditRoutes(app: FastifyInstance): Promise<void> {
  app.get(
    '/',
    {
      preHandler: [app.authorize('audit:list')],
      schema: { tags: ['audit'], querystring: auditListQuerySchema, response: { 200: pagedResponseSchema(looseEntitySchema) } },
    },
    async (request, reply) => ok(reply, request, await listAuditLogsService(request.query as AuditListQuery)),
  );

  app.get(
    '/export.csv',
    { preHandler: [app.authorize('audit:list')], schema: { tags: ['audit'], querystring: auditListQuerySchema } },
    async (request, reply) => {
      const csv = await exportAuditLogsCsvService(request.query as AuditListQuery);
      return reply.header('Content-Type', 'text/csv; charset=utf-8').send(csv);
    },
  );

  app.get(
    '/:id',
    {
      preHandler: [app.authorize('audit:list')],
      schema: { tags: ['audit'], params: idParams, response: { 200: successResponseSchema(looseEntitySchema) } },
    },
    async (request, reply) => ok(reply, request, await getAuditLogService((request.params as IdParams).id)),
  );
}
