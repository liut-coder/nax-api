import { z } from 'zod';

export const healthResponseSchema = z.object({
  status: z.literal('ok'),
  uptime: z.number(),
  timestamp: z.string(),
});

export const readinessResponseSchema = healthResponseSchema.extend({
  checks: z.object({
    database: z.literal('ok'),
  }),
});
