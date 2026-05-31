import 'dotenv/config';
import { z } from 'zod';

const booleanEnv = z.preprocess((value) => {
  if (typeof value !== 'string') return value;
  if (value.toLowerCase() === 'true') return true;
  if (value.toLowerCase() === 'false') return false;
  return value;
}, z.boolean());

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  HOST: z.string().default('0.0.0.0'),
  PORT: z.coerce.number().int().positive().default(3000),
  LOG_LEVEL: z.string().default('info'),
  DATABASE_URL: z.string().url(),
  DB_POOL_MAX: z.coerce.number().int().positive().default(10),
  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  REFRESH_TOKEN_DAYS: z.coerce.number().int().positive().default(30),
  REFRESH_COOKIE_NAME: z.string().default('nax_refresh_token'),
  COOKIE_SECURE: booleanEnv.default(false),
  CORS_ORIGIN: z.string().default('*'),
  UPLOAD_DIR: z.string().default('uploads'),
  MAX_UPLOAD_BYTES: z.coerce.number().int().positive().default(10 * 1024 * 1024),
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(120),
  RATE_LIMIT_WINDOW: z.string().default('1 minute'),
  LOGIN_RATE_LIMIT_MAX: z.coerce.number().int().positive().default(10),
  LOGIN_FAILURE_LIMIT: z.coerce.number().int().positive().default(5),
  LOGIN_FAILURE_WINDOW_SECONDS: z.coerce.number().int().positive().default(15 * 60),
  ADMIN_EMAIL: z.string().email().default('admin@example.com'),
  ADMIN_USERNAME: z.string().min(3).default('admin'),
  ADMIN_DISPLAY_NAME: z.string().default('Administrator'),
  ADMIN_PASSWORD: z.string().min(8).optional(),
});

export type Env = z.infer<typeof envSchema>;

export const env = envSchema.parse(process.env);
