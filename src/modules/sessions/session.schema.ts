import { z } from 'zod';
import { booleanQuerySchema, paginationQuerySchema } from '../../shared/pagination.js';

export const sessionListQuerySchema = paginationQuerySchema.extend({
  q: z.string().optional(),
  userId: z.string().uuid().optional(),
  active: booleanQuerySchema.optional(),
});

export type SessionListQuery = z.infer<typeof sessionListQuerySchema>;
