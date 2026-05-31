import { z, type ZodTypeAny } from 'zod';

export function successResponseSchema<T extends ZodTypeAny>(data: T) {
  return z.object({
    success: z.literal(true),
    data,
    message: z.string(),
    requestId: z.string(),
  });
}

export const errorResponseSchema = z.object({
  success: z.literal(false),
  error: z.object({
    code: z.string(),
    message: z.string(),
  }),
  requestId: z.string(),
});

export const mutationResultSchema = z.object({
  deleted: z.boolean().optional(),
  revoked: z.boolean().optional(),
  changed: z.boolean().optional(),
  loggedOut: z.boolean().optional(),
});

export const timestampedEntitySchema = z.object({
  id: z.string().uuid(),
  createdAt: z.date(),
  updatedAt: z.date().optional(),
});

export const looseEntitySchema = z.object({}).passthrough();

export function pagedResponseSchema<T extends ZodTypeAny>(item: T) {
  return successResponseSchema(
    z.object({
      items: z.array(item),
      pagination: z.object({
        page: z.number(),
        pageSize: z.number(),
        total: z.number(),
        totalPages: z.number(),
      }),
    }),
  );
}
