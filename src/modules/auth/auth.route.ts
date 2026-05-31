import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { env } from '../../config/env.js';
import { ok } from '../../shared/response.js';
import {
  authMenuSchema,
  authSessionSchema,
  changePasswordBodySchema,
  changePasswordResponseSchema,
  loginBodySchema,
  loginResponseSchema,
  logoutResponseSchema,
  revokeSessionResponseSchema,
  updateProfileBodySchema,
  authUserSchema,
  type ChangePasswordBody,
  type LoginBody,
  type UpdateProfileBody,
} from './auth.schema.js';
import { successResponseSchema } from '../../shared/openapi.js';
import {
  changePassword,
  currentUserMenus,
  listSessions,
  login,
  logout,
  logoutAll,
  me,
  refresh,
  revokeSession,
  updateProfile,
} from './auth.service.js';

const idParams = z.object({ id: z.string().uuid() });
type IdParams = z.infer<typeof idParams>;

export async function authRoutes(app: FastifyInstance): Promise<void> {
  app.post(
    '/login',
    {
      schema: {
        tags: ['auth'],
        summary: 'Login with username/email and password',
        body: loginBodySchema,
        response: { 200: successResponseSchema(loginResponseSchema) },
      },
      config: {
        rateLimit: {
          max: env.LOGIN_RATE_LIMIT_MAX,
        },
      },
    },
    async (request, reply) => ok(reply, request, await login(request, reply, request.body as LoginBody)),
  );

  app.post('/refresh', { schema: { tags: ['auth'], summary: 'Refresh access token', response: { 200: successResponseSchema(loginResponseSchema) } } }, async (request, reply) =>
    ok(reply, request, await refresh(request, reply)),
  );

  app.post(
    '/logout',
    {
      preHandler: [app.authenticate],
      schema: {
        tags: ['auth'],
        summary: 'Logout current refresh token',
        security: [{ bearerAuth: [] }],
        response: { 200: successResponseSchema(logoutResponseSchema) },
      },
    },
    async (request, reply) => ok(reply, request, await logout(request, reply)),
  );

  app.post(
    '/logout-all',
    {
      preHandler: [app.authenticate],
      schema: {
        tags: ['auth'],
        summary: 'Revoke all refresh tokens',
        security: [{ bearerAuth: [] }],
        response: { 200: successResponseSchema(logoutResponseSchema) },
      },
    },
    async (request, reply) => ok(reply, request, await logoutAll(request, reply)),
  );

  app.get(
    '/me',
    {
      preHandler: [app.authenticate],
      schema: {
        tags: ['auth'],
        summary: 'Current user profile',
        security: [{ bearerAuth: [] }],
        response: { 200: successResponseSchema(authUserSchema) },
      },
    },
    async (request, reply) => ok(reply, request, await me(request)),
  );

  app.patch(
    '/profile',
    {
      preHandler: [app.authenticate],
      schema: {
        tags: ['auth'],
        summary: 'Update current user profile',
        security: [{ bearerAuth: [] }],
        body: updateProfileBodySchema,
        response: { 200: successResponseSchema(authUserSchema) },
      },
    },
    async (request, reply) => ok(reply, request, await updateProfile(request, request.body as UpdateProfileBody)),
  );

  app.post(
    '/change-password',
    {
      preHandler: [app.authenticate],
      schema: {
        tags: ['auth'],
        summary: 'Change current user password',
        security: [{ bearerAuth: [] }],
        body: changePasswordBodySchema,
        response: { 200: successResponseSchema(changePasswordResponseSchema) },
      },
    },
    async (request, reply) => ok(reply, request, await changePassword(request, reply, request.body as ChangePasswordBody)),
  );

  app.get(
    '/sessions',
    {
      preHandler: [app.authenticate],
      schema: {
        tags: ['auth'],
        summary: 'List current user sessions',
        security: [{ bearerAuth: [] }],
        response: { 200: successResponseSchema(z.array(authSessionSchema)) },
      },
    },
    async (request, reply) => ok(reply, request, await listSessions(request)),
  );

  app.delete(
    '/sessions/:id',
    {
      preHandler: [app.authenticate],
      schema: {
        tags: ['auth'],
        summary: 'Revoke current user session',
        security: [{ bearerAuth: [] }],
        params: idParams,
        response: { 200: successResponseSchema(revokeSessionResponseSchema) },
      },
    },
    async (request, reply) => ok(reply, request, await revokeSession(request, (request.params as IdParams).id)),
  );

  app.get(
    '/menus',
    {
      preHandler: [app.authenticate],
      schema: {
        tags: ['auth'],
        summary: 'Current user visible menu tree',
        security: [{ bearerAuth: [] }],
        response: { 200: successResponseSchema(z.array(authMenuSchema)) },
      },
    },
    async (request, reply) => ok(reply, request, await currentUserMenus(request)),
  );
}
