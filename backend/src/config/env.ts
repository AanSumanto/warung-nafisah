import { z } from 'zod';
import dotenv from 'dotenv';
import { parseCorsOrigins, CorsOriginError } from './cors-origins.js';

dotenv.config();

export const DEV_JWT_SECRET = 'dev-warung-nafisah-jwt-secret';

const redisUrlSchema = z
  .string()
  .min(1, 'REDIS_URL is required')
  .refine(
    (url) => url.startsWith('redis://') || url.startsWith('rediss://'),
    'REDIS_URL must start with redis:// or rediss://',
  );

function validateCorsOrigins(value: string, ctx: z.RefinementCtx): string[] | null {
  try {
    return parseCorsOrigins(value);
  } catch (error) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['CORS_ORIGINS'],
      message: error instanceof CorsOriginError ? error.message : 'Invalid CORS_ORIGINS',
    });
    return null;
  }
}

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
    const origins = validateCorsOrigins(data.CORS_ORIGINS, ctx);
    if (!origins) return;

    if (data.NODE_ENV !== 'production') return;

    if (origins.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['CORS_ORIGINS'],
        message: 'CORS_ORIGINS must include at least one origin in production',
      });
      return;
    }

    for (const origin of origins) {
      if (/localhost|127\.0\.0\.1/i.test(origin)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['CORS_ORIGINS'],
          message: 'CORS_ORIGINS must not include localhost in production',
        });
        break;
      }

      if (!origin.startsWith('https://')) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['CORS_ORIGINS'],
          message: 'Production CORS origins must use HTTPS',
        });
        break;
      }
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
  return parseCorsOrigins(getEnv().CORS_ORIGINS);
}
