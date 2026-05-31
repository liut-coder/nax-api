import type { FastifyInstance } from 'fastify';
import { createReadStream } from 'node:fs';
import { z } from 'zod';
import { AppError } from '../../shared/errors.js';
import { created, ok } from '../../shared/response.js';
import { fileListQuerySchema, type FileListQuery } from './file.schema.js';
import { deleteFileService, getFileService, listFilesService, uploadFileService } from './file.service.js';

const idParams = z.object({ id: z.string().uuid() });
type IdParams = z.infer<typeof idParams>;

export async function fileRoutes(app: FastifyInstance): Promise<void> {
  app.get(
    '/',
    { preHandler: [app.authorize('file:list')], schema: { tags: ['files'], querystring: fileListQuerySchema } },
    async (request, reply) => ok(reply, request, await listFilesService(request.query as FileListQuery)),
  );

  app.post(
    '/upload',
    {
      preHandler: [app.authorize('file:upload')],
      schema: {
        tags: ['files'],
        summary: 'Upload a file using multipart/form-data field named file',
        consumes: ['multipart/form-data'],
      },
    },
    async (request, reply) => {
      const file = await request.file();
      if (!file) throw new AppError('FILE_REQUIRED', 'Multipart file field is required', 400);
      return created(reply, request, await uploadFileService(request, file));
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
      schema: { tags: ['files'], params: idParams },
    },
    async (request, reply) => ok(reply, request, await deleteFileService(request, (request.params as IdParams).id)),
  );
}
