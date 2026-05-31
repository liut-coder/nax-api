import type { FastifyInstance } from 'fastify';
import { ok } from '../../shared/response.js';
import { loginBodySchema, type LoginBody } from './auth.schema.js';
import { login, logout, logoutAll, me, refresh } from './auth.service.js';

export async function authRoutes(app: FastifyInstance): Promise<void> {
  app.post(
    '/login',
    {
      schema: {
        tags: ['auth'],
        summary: 'Login with username/email and password',
        body: loginBodySchema,
      },
    },
    async (request, reply) => ok(reply, request, await login(request, reply, request.body as LoginBody)),
  );

  app.post('/refresh', { schema: { tags: ['auth'], summary: 'Refresh access token' } }, async (request, reply) =>
    ok(reply, request, await refresh(request, reply)),
  );

  app.post(
    '/logout',
    {
      preHandler: [app.authenticate],
      schema: { tags: ['auth'], summary: 'Logout current refresh token', security: [{ bearerAuth: [] }] },
    },
    async (request, reply) => ok(reply, request, await logout(request, reply)),
  );

  app.post(
    '/logout-all',
    {
      preHandler: [app.authenticate],
      schema: { tags: ['auth'], summary: 'Revoke all refresh tokens', security: [{ bearerAuth: [] }] },
    },
    async (request, reply) => ok(reply, request, await logoutAll(request, reply)),
  );

  app.get(
    '/me',
    {
      preHandler: [app.authenticate],
      schema: { tags: ['auth'], summary: 'Current user profile', security: [{ bearerAuth: [] }] },
    },
    async (request, reply) => ok(reply, request, await me(request)),
  );
}
