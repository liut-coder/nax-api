import { z } from 'zod';
import { booleanQuerySchema, paginationQuerySchema } from '../../shared/pagination.js';

const metaSchema = z.record(z.string(), z.unknown());

export const menuListQuerySchema = paginationQuerySchema.extend({
  q: z.string().optional(),
  parentId: z.string().uuid().optional(),
  visible: booleanQuerySchema.optional(),
  enabled: booleanQuerySchema.optional(),
});

export const createMenuBodySchema = z.object({
  parentId: z.string().uuid().nullable().optional(),
  key: z.string().min(2).max(120).regex(/^[a-zA-Z0-9_.:-]+$/),
  title: z.string().min(1).max(160),
  path: z.string().max(240).nullable().optional(),
  icon: z.string().max(80).nullable().optional(),
  permissionKey: z.string().max(120).nullable().optional(),
  sortOrder: z.number().int().default(0),
  isVisible: z.boolean().default(true),
  isEnabled: z.boolean().default(true),
  meta: metaSchema.default({}),
});

export const updateMenuBodySchema = z.object({
  parentId: z.string().uuid().nullable().optional(),
  title: z.string().min(1).max(160).optional(),
  path: z.string().max(240).nullable().optional(),
  icon: z.string().max(80).nullable().optional(),
  permissionKey: z.string().max(120).nullable().optional(),
  sortOrder: z.number().int().optional(),
  isVisible: z.boolean().optional(),
  isEnabled: z.boolean().optional(),
  meta: metaSchema.optional(),
});

export type MenuListQuery = z.infer<typeof menuListQuerySchema>;
export type CreateMenuBody = z.infer<typeof createMenuBodySchema>;
export type UpdateMenuBody = z.infer<typeof updateMenuBodySchema>;
