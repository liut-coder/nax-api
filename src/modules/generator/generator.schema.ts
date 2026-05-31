import { z } from 'zod';

export const moduleNameSchema = z
  .string()
  .min(2)
  .max(60)
  .regex(/^[a-z][a-z0-9-]*$/);

export const generatorPreviewBodySchema = z.object({
  name: moduleNameSchema,
  tableName: z
    .string()
    .min(2)
    .max(80)
    .regex(/^[a-z][a-z0-9_]*$/)
    .optional(),
  resource: z
    .string()
    .min(2)
    .max(80)
    .regex(/^[a-z][a-z0-9:-]*$/)
    .optional(),
});

export const projectPreviewBodySchema = z.object({
  name: z
    .string()
    .min(2)
    .max(80)
    .regex(/^[a-z][a-z0-9-]*$/),
  description: z.string().max(200).default('Reusable management backend API'),
  packageName: z
    .string()
    .min(2)
    .max(120)
    .regex(/^(@[a-z0-9-]+\/)?[a-z][a-z0-9-]*$/)
    .optional(),
});

export type GeneratorPreviewBody = z.infer<typeof generatorPreviewBodySchema>;
export type ProjectPreviewBody = z.infer<typeof projectPreviewBodySchema>;
