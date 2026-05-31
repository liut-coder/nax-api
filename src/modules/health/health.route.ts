import type { FastifyInstance } from 'fastify';
import { successResponseSchema } from '../../shared/openapi.js';
import { ok } from '../../shared/response.js';
import { getLiveness, getReadiness } from './health.service.js';
import { healthResponseSchema, readinessResponseSchema } from './health.schema.js';

export async function healthRoutes(app: FastifyInstance): Promise<void> {
  app.get(
    '/',
    {
      schema: {
        tags: ['health'],
        summary: 'Readiness check',
        response: {
          200: successResponseSchema(readinessResponseSchema),
        },
      },
    },
    async (request, reply) => {
      return ok(reply, request, await getReadiness());
    },
  );

  app.get(
    '/live',
    {
      schema: {
        tags: ['health'],
        summary: 'Liveness check',
        response: {
          200: successResponseSchema(healthResponseSchema),
        },
      },
    },
    async (request, reply) => {
      return ok(reply, request, getLiveness());
    },
  );

  app.get(
    '/ready',
    {
      schema: {
        tags: ['health'],
        summary: 'Readiness check',
        response: {
          200: successResponseSchema(readinessResponseSchema),
        },
      },
    },
    async (request, reply) => {
      return ok(reply, request, await getReadiness());
    },
  );
}
