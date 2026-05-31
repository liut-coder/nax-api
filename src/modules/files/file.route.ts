import type { FastifyInstance } from 'fastify';
import { createReadStream } from 'node:fs';
import { z } from 'zod';
import { AppError } from '../../shared/errors.js';
import { looseEntitySchema, mutationResultSchema, pagedResponseSchema, successResponseSchema } from '../../shared/openapi.js';
import { created, ok } from '../../shared/response.js';
import { fileListQuerySchema, fileUploadMetaSchema, type FileListQuery } from './file.schema.js';
import { deleteFileService, getFileService, getPublicFileService, listFilesService, uploadFileService } from './file.service.js';

const idParams = z.object({ id: z.string().uuid() });
type IdParams = z.infer<typeof idParams>;

export async function fileRoutes(app: FastifyInstance): Promise<void> {
  app.get(
    '/',
    {
      preHandler: [app.authorize('file:list')],
      schema: { tags: ['files'], querystring: fileListQuerySchema, response: { 200: pagedResponseSchema(looseEntitySchema) } },
    },
    async (request, reply) => ok(reply, request, await listFilesService(request.query as FileListQuery)),
  );

  app.post(
    '/upload',
    {
      preHandler: [app.authorize('file:upload')],
      schema: {
        tags: ['files'],
        summary: 'Upload a file using multipart/form-data field named file',
        description: 'Optional fields: category, isPublic. Public files can be read through /api/v1/public/files/:id.',
        consumes: ['multipart/form-data'],
        response: { 201: successResponseSchema(looseEntitySchema) },
      },
    },
    async (request, reply) => {
      const file = await request.file();
      if (!file) throw new AppError('FILE_REQUIRED', 'Multipart file field is required', 400);
      const fields = file.fields as Record<string, { value?: unknown } | undefined>;
      const meta = fileUploadMetaSchema.parse({
        category: typeof fields.category?.value === 'string' ? fields.category.value : undefined,
        isPublic: fields.isPublic?.value === true || fields.isPublic?.value === 'true',
      });
      return created(reply, request, await uploadFileService(request, file, meta));
    },
  );

  app.get(
    '/:id/download',
    {
      preHandler: [app.authorize('file:list')],
      schema: { tags: ['files'], params: idParams },
    },
    async (request, reply) => {
      const file = await getFileService((request.params as IdParams).id);
      return reply
        .header('Content-Type', file.mimeType)
        .header('Content-Disposition', `attachment; filename="${encodeURIComponent(file.originalName)}"`)
        .send(createReadStream(file.path));
    },
  );

  app.delete(
    '/:id',
    {
      preHandler: [app.authorize('file:delete')],
      schema: { tags: ['files'], params: idParams, response: { 200: successResponseSchema(mutationResultSchema) } },
    },
    async (request, reply) => ok(reply, request, await deleteFileService(request, (request.params as IdParams).id)),
  );

  app.get(
    '/public/:id',
    {
      schema: {
        tags: ['files'],
        summary: 'Read a public file inline',
        params: idParams,
      },
    },
    async (request, reply) => {
      const file = await getPublicFileService((request.params as IdParams).id);
      return reply
        .header('Content-Type', file.mimeType)
        .header('Cache-Control', 'public, max-age=31536000, immutable')
        .send(createReadStream(file.path));
    },
  );
}
