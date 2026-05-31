import type { FastifyInstance } from 'fastify';
import { ok } from '../../shared/response.js';
import {
  generatorPreviewBodySchema,
  projectPreviewBodySchema,
  type GeneratorPreviewBody,
  type ProjectPreviewBody,
} from './generator.schema.js';
import { buildModulePreview, buildProjectPreview } from './generator.service.js';

export async function generatorRoutes(app: FastifyInstance): Promise<void> {
  app.post(
    '/modules/preview',
    {
      preHandler: [app.authorize('generator:preview')],
      schema: {
        tags: ['generator'],
        summary: 'Preview files for a generated CRUD module',
        security: [{ bearerAuth: [] }],
        body: generatorPreviewBodySchema,
      },
    },
    async (request, reply) => ok(reply, request, buildModulePreview(request.body as GeneratorPreviewBody)),
  );

  app.post(
    '/projects/preview',
    {
      preHandler: [app.authorize('generator:preview')],
      schema: {
        tags: ['generator'],
        summary: 'Preview files for a new lightweight project scaffold',
        security: [{ bearerAuth: [] }],
        body: projectPreviewBodySchema,
      },
    },
    async (request, reply) => ok(reply, request, buildProjectPreview(request.body as ProjectPreviewBody)),
  );
}
