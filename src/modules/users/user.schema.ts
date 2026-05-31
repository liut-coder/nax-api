import { z } from 'zod';
import { paginationQuerySchema } from '../../shared/pagination.js';

export const userListQuerySchema = paginationQuerySchema.extend({
  q: z.string().optional(),
});

export const createUserBodySchema = z.object({
  email: z.string().email(),
  username: z.string().min(3).max(80),
  displayName: z.string().min(1).max(120),
  password: z.string().min(8),
  roleIds: z.array(z.string().uuid()).default([]),
});

export const updateUserBodySchema = z.object({
  email: z.string().email().optional(),
  username: z.string().min(3).max(80).optional(),
  displayName: z.string().min(1).max(120).optional(),
  password: z.string().min(8).optional(),
  isActive: z.boolean().optional(),
  roleIds: z.array(z.string().uuid()).optional(),
});

export type UserListQuery = z.infer<typeof userListQuerySchema>;
export type CreateUserBody = z.infer<typeof createUserBodySchema>;
export type UpdateUserBody = z.infer<typeof updateUserBodySchema>;

