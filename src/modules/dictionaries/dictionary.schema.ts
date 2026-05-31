import { z } from 'zod';
import { booleanQuerySchema, paginationQuerySchema } from '../../shared/pagination.js';

export const dictionaryListQuerySchema = paginationQuerySchema.extend({
  q: z.string().optional(),
  enabled: booleanQuerySchema.optional(),
});

export const createDictionaryBodySchema = z.object({
  key: z.string().min(2).max(120).regex(/^[a-zA-Z0-9_.:-]+$/),
  name: z.string().min(1).max(160),
  description: z.string().default(''),
  isEnabled: z.boolean().default(true),
});

export const updateDictionaryBodySchema = z.object({
  name: z.string().min(1).max(160).optional(),
  description: z.string().optional(),
  isEnabled: z.boolean().optional(),
});

export const createDictionaryItemBodySchema = z.object({
  label: z.string().min(1).max(160),
  value: z.string().min(1).max(160),
  color: z.string().max(40).optional().nullable(),
  sortOrder: z.number().int().default(0),
  isEnabled: z.boolean().default(true),
  meta: z.record(z.string(), z.unknown()).default({}),
});

export const updateDictionaryItemBodySchema = z.object({
  label: z.string().min(1).max(160).optional(),
  value: z.string().min(1).max(160).optional(),
  color: z.string().max(40).optional().nullable(),
  sortOrder: z.number().int().optional(),
  isEnabled: z.boolean().optional(),
  meta: z.record(z.string(), z.unknown()).optional(),
});

export type DictionaryListQuery = z.infer<typeof dictionaryListQuerySchema>;
export type CreateDictionaryBody = z.infer<typeof createDictionaryBodySchema>;
export type UpdateDictionaryBody = z.infer<typeof updateDictionaryBodySchema>;
export type CreateDictionaryItemBody = z.infer<typeof createDictionaryItemBodySchema>;
export type UpdateDictionaryItemBody = z.infer<typeof updateDictionaryItemBodySchema>;
