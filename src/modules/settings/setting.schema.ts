import { z } from 'zod';
import { booleanQuerySchema, paginationQuerySchema } from '../../shared/pagination.js';

export const settingListQuerySchema = paginationQuerySchema.extend({
  q: z.string().optional(),
  group: z.string().optional(),
  publicOnly: booleanQuerySchema.optional(),
});

export const upsertSettingBodySchema = z.object({
  value: z.unknown(),
  group: z.string().min(1).max(80).default('general'),
  type: z.enum(['string', 'number', 'boolean', 'json', 'url', 'color']).default('json'),
  isPublic: z.boolean().default(false),
  isEditable: z.boolean().default(true),
  description: z.string().default(''),
});

export type SettingListQuery = z.infer<typeof settingListQuerySchema>;
export type UpsertSettingBody = z.infer<typeof upsertSettingBodySchema>;
