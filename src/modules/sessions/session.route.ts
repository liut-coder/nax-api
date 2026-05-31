import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { looseEntitySchema, mutationResultSchema, pagedResponseSchema, successResponseSchema } from '../../shared/openapi.js';
import { ok } from '../../shared/response.js';
import { sessionListQuerySchema, type SessionListQuery } from './session.schema.js';
import { listSessionsService, revokeSessionService } from './session.service.js';

const idParams = z.object({ id: z.string().uuid() });
type IdParams = z.infer<typeof idParams>;

export async function sessionRoutes(app: FastifyInstance): Promise<void> {
  app.get(
    '/',
    {
      preHandler: [app.authorize('session:list')],
      schema: {
        tags: ['sessions'],
        querystring: sessionListQuerySchema,
        security: [{ bearerAuth: [] }],
        response: { 200: pagedResponseSchema(looseEntitySchema) },
      },
    },
    async (request, reply) => ok(reply, request, await listSessionsService(request.query as SessionListQuery)),
  );

  app.delete(
    '/:id',
    {
      preHandler: [app.authorize('session:revoke')],
      schema: {
        tags: ['sessions'],
        params: idParams,
        security: [{ bearerAuth: [] }],
        response: { 200: successResponseSchema(mutationResultSchema) },
      },
    },
    async (request, reply) => ok(reply, request, await revokeSessionService(request, (request.params as IdParams).id)),
  );
}
