import { z } from 'zod';

export const loginBodySchema = z.object({
  account: z.string().min(1),
  password: z.string().min(1),
});

export const authUserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  username: z.string(),
  displayName: z.string(),
  permissions: z.array(z.string()),
});

export const loginResponseSchema = z.object({
  accessToken: z.string(),
  user: authUserSchema,
});

export type LoginBody = z.infer<typeof loginBodySchema>;

