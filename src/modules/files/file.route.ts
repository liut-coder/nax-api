import type { FastifyInstance } from 'fastify';
import { AppError } from '../../shared/errors.js';
import { created, ok } from '../../shared/response.js';
import { fileListQuerySchema, type FileListQuery } from './file.schema.js';
import { listFilesService, uploadFileService } from './file.service.js';

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
}
