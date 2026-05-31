import { z } from 'zod';
import { paginationQuerySchema } from '../../shared/pagination.js';

export const auditListQuerySchema = paginationQuerySchema.extend({
  actorUserId: z.string().uuid().optional(),
  resource: z.string().optional(),
  action: z.string().optional(),
});

export type AuditListQuery = z.infer<typeof auditListQuerySchema>;

