import { z } from 'zod';
import { paginationQuerySchema } from '../../shared/pagination.js';

export const permissionListQuerySchema = paginationQuerySchema.extend({
  q: z.string().optional(),
  resource: z.string().optional(),
});

export type PermissionListQuery = z.infer<typeof permissionListQuerySchema>;

