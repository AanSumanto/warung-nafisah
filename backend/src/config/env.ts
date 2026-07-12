import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

export const DEV_JWT_SECRET = 'dev-warung-nafisah-jwt-secret';

const redisUrlSchema = z
  .string()
  .min(1, 'REDIS_URL is required')
  .refine(
    (url) => url.startsWith('redis://') || url.startsWith('rediss://'),
    'REDIS_URL must start with redis:// or rediss://',
  );

const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().int().positive().default(5000),
    HOST: z.string().default('0.0.0.0'),
    MONGODB_URI: z.string().min(1),
    MONGODB_DB_NAME: z.string().min(1),
    REDIS_URL: redisUrlSchema,
    LOG_LEVEL: z
      .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'])
      .default('info'),
    CORS_ORIGINS: z.string().default('http://localhost:3000'),
    JWT_SECRET: z.string().min(16).default(DEV_JWT_SECRET),
  })
  .superRefine((data, ctx) => {
    if (data.NODE_ENV !== 'production') return;

    if (data.JWT_SECRET === DEV_JWT_SECRET) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['JWT_SECRET'],
        message: 'JWT_SECRET must be set to a strong random value in production',
      });
    }

    const origins = data.CORS_ORIGINS.split(',')
      .map((o) => o.trim())
      .filter(Boolean);

    if (origins.some((origin) => /localhost|127\.0\.0\.1/i.test(origin))) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['CORS_ORIGINS'],
        message: 'CORS_ORIGINS must not include localhost in production',
      });
    }
  });

export type Env = z.infer<typeof envSchema>;

let cached: Env | null = null;

export function getEnv(): Env {
  if (!cached) {
    const parsed = envSchema.safeParse(process.env);
    if (!parsed.success) {
      const message = parsed.error.issues
        .map((i) => `${i.path.join('.')}: ${i.message}`)
        .join('; ');
      throw new Error(`Environment validation failed: ${message}`);
    }
    cached = parsed.data;
  }
  return cached;
}

export function resetEnvCache(): void {
  cached = null;
}

export function getCorsOrigins(): string[] {
  return getEnv()
    .CORS_ORIGINS.split(',')
    .map((o) => o.trim())
    .filter(Boolean);
}
