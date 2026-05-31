import type { FastifyInstance } from 'fastify';
import { createReadStream } from 'node:fs';
import { z } from 'zod';
import { getPublicFileService } from '../files/file.service.js';

const idParams = z.object({ id: z.string().uuid() });
type IdParams = z.infer<typeof idParams>;

export async function publicRoutes(app: FastifyInstance): Promise<void> {
  app.get(
    '/files/:id',
    {
      schema: {
        tags: ['public'],
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
