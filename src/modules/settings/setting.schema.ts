import { z } from 'zod';
import { paginationQuerySchema } from '../../shared/pagination.js';

export const settingListQuerySchema = paginationQuerySchema.extend({
  q: z.string().optional(),
});

export const upsertSettingBodySchema = z.object({
  value: z.unknown(),
  description: z.string().default(''),
});

export type SettingListQuery = z.infer<typeof settingListQuerySchema>;
export type UpsertSettingBody = z.infer<typeof upsertSettingBodySchema>;

