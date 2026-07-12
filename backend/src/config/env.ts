import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const redisUrlSchema = z
  .string()
  .min(1, 'REDIS_URL is required')
  .refine(
    (url) => url.startsWith('redis://') || url.startsWith('rediss://'),
    'REDIS_URL must start with redis:// or rediss://',
  );

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(5000),
  HOST: z.string().default('0.0.0.0'),
  MONGODB_URI: z.string().min(1),
  MONGODB_DB_NAME: z.string().min(1),
  REDIS_URL: redisUrlSchema,
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),
  CORS_ORIGINS: z.string().default('http://localhost:3000'),
  JWT_SECRET: z.string().min(16).default('dev-warung-nafisah-jwt-secret'),
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
