import { z } from 'zod';
import { paginationQuerySchema } from '../../shared/pagination.js';

export const fileListQuerySchema = paginationQuerySchema.extend({
  q: z.string().optional(),
});

export type FileListQuery = z.infer<typeof fileListQuerySchema>;

