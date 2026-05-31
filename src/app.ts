import fastifyCookie from '@fastify/cookie';
import fastifyCors from '@fastify/cors';
import fastifyJwt from '@fastify/jwt';
import fastifyMultipart from '@fastify/multipart';
import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUi from '@fastify/swagger-ui';
import Fastify from 'fastify';
import {
  jsonSchemaTransform,
  serializerCompiler,
  validatorCompiler,
  type ZodTypeProvider,
} from 'fastify-type-provider-zod';
import { randomUUID } from 'node:crypto';
import { ZodError } from 'zod';
import { env } from './config/env.js';
import { AppError, ForbiddenError, UnauthorizedError } from './shared/errors.js';
import { fail } from './shared/response.js';
import { registerRoutes } from './routes.js';

export async function buildApp() {
  const app = Fastify({
    logger: {
      level: env.LOG_LEVEL,
      redact: ['req.headers.authorization', 'req.headers.cookie'],
    },
    genReqId: () => `req_${randomUUID()}`,
  }).withTypeProvider<ZodTypeProvider>();

  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);

  await app.register(fastifyCors, {
    origin: env.CORS_ORIGIN === '*' ? true : env.CORS_ORIGIN.split(',').map((item) => item.trim()),
    credentials: true,
  });
  await app.register(fastifyCookie);
  await app.register(fastifyJwt, {
    secret: env.JWT_ACCESS_SECRET,
  });
  await app.register(fastifyMultipart, {
    limits: {
      fileSize: env.MAX_UPLOAD_BYTES,
    },
  });
  await app.register(fastifySwagger, {
    openapi: {
      info: {
        title: 'NAX API',
        description: 'Reusable lightweight management backend API scaffold.',
        version: '0.1.0',
      },
      servers: [{ url: '/api/v1' }],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
          },
        },
      },
    },
    transform: jsonSchemaTransform,
  });
  await app.register(fastifySwaggerUi, {
    routePrefix: '/docs',
  });

  app.decorate('authenticate', async (request) => {
    try {
      const payload = await request.jwtVerify<{
        sub: string;
        email: string;
        username: string;
        permissions: string[];
      }>();
      request.auth = {
        userId: payload.sub,
        email: payload.email,
        username: payload.username,
        permissions: payload.permissions ?? [],
      };
    } catch {
      throw new UnauthorizedError();
    }
  });

  app.decorate('authorize', (permission: string) => {
    return async (request, reply) => {
      await app.authenticate(request, reply);
      if (!request.auth?.permissions.includes(permission)) {
        throw new ForbiddenError(`Missing permission: ${permission}`);
      }
    };
  });

  app.setErrorHandler((error, request, reply) => {
    if (error instanceof AppError) {
      return fail(reply, request, error.statusCode, error.code, error.message);
    }
    if (error instanceof ZodError) {
      return fail(reply, request, 400, 'VALIDATION_ERROR', error.message);
    }
    if (error && typeof error === 'object' && 'validation' in error) {
      const message = 'message' in error && typeof error.message === 'string' ? error.message : 'Validation failed';
      return fail(reply, request, 400, 'VALIDATION_ERROR', message);
    }
    request.log.error({ err: error }, 'Unhandled request error');
    return fail(reply, request, 500, 'INTERNAL_SERVER_ERROR', 'Internal server error');
  });

  await registerRoutes(app);

  return app;
}
