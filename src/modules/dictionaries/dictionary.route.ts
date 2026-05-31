import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { looseEntitySchema, mutationResultSchema, pagedResponseSchema, successResponseSchema } from '../../shared/openapi.js';
import { created, ok } from '../../shared/response.js';
import {
  createDictionaryBodySchema,
  createDictionaryItemBodySchema,
  dictionaryListQuerySchema,
  updateDictionaryBodySchema,
  updateDictionaryItemBodySchema,
  type CreateDictionaryBody,
  type CreateDictionaryItemBody,
  type DictionaryListQuery,
  type UpdateDictionaryBody,
  type UpdateDictionaryItemBody,
} from './dictionary.schema.js';
import {
  createDictionaryItemService,
  createDictionaryService,
  deleteDictionaryItemService,
  deleteDictionaryService,
  getDictionaryByKeyService,
  getDictionaryService,
  listDictionariesService,
  updateDictionaryItemService,
  updateDictionaryService,
} from './dictionary.service.js';

const idParams = z.object({ id: z.string().uuid() });
const keyParams = z.object({ key: z.string().min(1) });
const itemParams = z.object({ itemId: z.string().uuid() });
type IdParams = z.infer<typeof idParams>;
type KeyParams = z.infer<typeof keyParams>;
type ItemParams = z.infer<typeof itemParams>;

export async function dictionaryRoutes(app: FastifyInstance): Promise<void> {
  app.get(
    '/',
    {
      preHandler: [app.authorize('dictionary:list')],
      schema: {
        tags: ['dictionaries'],
        querystring: dictionaryListQuerySchema,
        response: { 200: pagedResponseSchema(looseEntitySchema) },
      },
    },
    async (request, reply) => ok(reply, request, await listDictionariesService(request.query as DictionaryListQuery)),
  );

  app.get(
    '/key/:key',
    {
      preHandler: [app.authorize('dictionary:read')],
      schema: { tags: ['dictionaries'], params: keyParams, response: { 200: successResponseSchema(looseEntitySchema) } },
    },
    async (request, reply) => ok(reply, request, await getDictionaryByKeyService((request.params as KeyParams).key)),
  );

  app.get(
    '/:id',
    {
      preHandler: [app.authorize('dictionary:read')],
      schema: { tags: ['dictionaries'], params: idParams, response: { 200: successResponseSchema(looseEntitySchema) } },
    },
    async (request, reply) => ok(reply, request, await getDictionaryService((request.params as IdParams).id)),
  );

  app.post(
    '/',
    {
      preHandler: [app.authorize('dictionary:create')],
      schema: {
        tags: ['dictionaries'],
        body: createDictionaryBodySchema,
        response: { 201: successResponseSchema(looseEntitySchema) },
      },
    },
    async (request, reply) => created(reply, request, await createDictionaryService(request, request.body as CreateDictionaryBody)),
  );

  app.patch(
    '/:id',
    {
      preHandler: [app.authorize('dictionary:update')],
      schema: {
        tags: ['dictionaries'],
        params: idParams,
        body: updateDictionaryBodySchema,
        response: { 200: successResponseSchema(looseEntitySchema) },
      },
    },
    async (request, reply) =>
      ok(reply, request, await updateDictionaryService(request, (request.params as IdParams).id, request.body as UpdateDictionaryBody)),
  );

  app.delete(
    '/:id',
    {
      preHandler: [app.authorize('dictionary:delete')],
      schema: { tags: ['dictionaries'], params: idParams, response: { 200: successResponseSchema(mutationResultSchema) } },
    },
    async (request, reply) => ok(reply, request, await deleteDictionaryService(request, (request.params as IdParams).id)),
  );

  app.post(
    '/:id/items',
    {
      preHandler: [app.authorize('dictionary:update')],
      schema: {
        tags: ['dictionaries'],
        params: idParams,
        body: createDictionaryItemBodySchema,
        response: { 201: successResponseSchema(looseEntitySchema) },
      },
    },
    async (request, reply) =>
      created(
        reply,
        request,
        await createDictionaryItemService(request, (request.params as IdParams).id, request.body as CreateDictionaryItemBody),
      ),
  );

  app.patch(
    '/items/:itemId',
    {
      preHandler: [app.authorize('dictionary:update')],
      schema: {
        tags: ['dictionaries'],
        params: itemParams,
        body: updateDictionaryItemBodySchema,
        response: { 200: successResponseSchema(looseEntitySchema) },
      },
    },
    async (request, reply) =>
      ok(
        reply,
        request,
        await updateDictionaryItemService(request, (request.params as ItemParams).itemId, request.body as UpdateDictionaryItemBody),
      ),
  );

  app.delete(
    '/items/:itemId',
    {
      preHandler: [app.authorize('dictionary:update')],
      schema: { tags: ['dictionaries'], params: itemParams, response: { 200: successResponseSchema(mutationResultSchema) } },
    },
    async (request, reply) => ok(reply, request, await deleteDictionaryItemService(request, (request.params as ItemParams).itemId)),
  );
}
