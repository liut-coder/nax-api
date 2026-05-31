import { z } from 'zod';
import { paginationQuerySchema } from '../../shared/pagination.js';

export const roleListQuerySchema = paginationQuerySchema.extend({
  q: z.string().optional(),
});

export const createRoleBodySchema = z.object({
  key: z.string().min(2).max(80),
  name: z.string().min(1).max(120),
  description: z.string().default(''),
  permissionIds: z.array(z.string().uuid()).default([]),
});

export const updateRoleBodySchema = z.object({
  name: z.string().min(1).max(120).optional(),
  description: z.string().optional(),
  permissionIds: z.array(z.string().uuid()).optional(),
});

export type RoleListQuery = z.infer<typeof roleListQuerySchema>;
export type CreateRoleBody = z.infer<typeof createRoleBodySchema>;
export type UpdateRoleBody = z.infer<typeof updateRoleBodySchema>;

