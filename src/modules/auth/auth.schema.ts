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
  status: z.string(),
  permissions: z.array(z.string()),
});

export const loginResponseSchema = z.object({
  accessToken: z.string(),
  user: authUserSchema,
});

export const logoutResponseSchema = z.object({
  loggedOut: z.literal(true),
});

export const changePasswordResponseSchema = z.object({
  changed: z.literal(true),
});

export const revokeSessionResponseSchema = z.object({
  revoked: z.literal(true),
});

export const authSessionSchema = z.object({
  id: z.string().uuid(),
  userAgent: z.string().nullable(),
  ipAddress: z.string().nullable(),
  expiresAt: z.date(),
  revokedAt: z.date().nullable(),
  lastUsedAt: z.date().nullable(),
  createdAt: z.date(),
  isActive: z.boolean(),
});

export const authMenuSchema: z.ZodType<{
  id: string;
  key: string;
  title: string;
  path: string | null;
  icon: string | null;
  permissionKey: string | null;
  sortOrder: number;
  meta: unknown;
  children: unknown[];
}> = z.lazy(() =>
  z.object({
    id: z.string().uuid(),
    key: z.string(),
    title: z.string(),
    path: z.string().nullable(),
    icon: z.string().nullable(),
    permissionKey: z.string().nullable(),
    sortOrder: z.number(),
    meta: z.unknown(),
    children: z.array(authMenuSchema),
  }),
);

export const updateProfileBodySchema = z.object({
  displayName: z.string().min(1).max(120),
});

export const changePasswordBodySchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8),
});

export type LoginBody = z.infer<typeof loginBodySchema>;
export type UpdateProfileBody = z.infer<typeof updateProfileBodySchema>;
export type ChangePasswordBody = z.infer<typeof changePasswordBodySchema>;
