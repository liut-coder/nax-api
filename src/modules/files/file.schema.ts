import { z } from 'zod';
import { paginationQuerySchema } from '../../shared/pagination.js';

export const fileListQuerySchema = paginationQuerySchema.extend({
  q: z.string().optional(),
  category: z.string().optional(),
});

export const fileUploadMetaSchema = z.object({
  category: z.string().min(1).max(80).default('attachment'),
  isPublic: z.boolean().default(false),
});

export type FileListQuery = z.infer<typeof fileListQuerySchema>;
export type FileUploadMeta = z.infer<typeof fileUploadMetaSchema>;
