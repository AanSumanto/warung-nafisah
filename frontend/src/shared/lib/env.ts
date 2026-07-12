import { z } from 'zod';

const clientEnvSchema = z.object({
  NEXT_PUBLIC_API_BASE_URL: z
    .string()
    .default('http://localhost:5000')
    .refine(
      (value) => value === '' || z.string().url().safeParse(value).success,
      'NEXT_PUBLIC_API_BASE_URL must be empty (same origin) or a valid URL',
    ),
  NEXT_PUBLIC_APP_NAME: z.string().min(1).default('Warung Nafisah ERP'),
});

export type ClientEnv = z.infer<typeof clientEnvSchema>;

let cached: ClientEnv | null = null;

export function getClientEnv(): ClientEnv {
  if (cached) return cached;

  const parsed = clientEnvSchema.safeParse({
    NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
    NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
  });

  if (!parsed.success) {
    const message = parsed.error.issues.map((i) => i.message).join('; ');
    throw new Error(`Environment validation failed: ${message}`);
  }

  cached = parsed.data;
  return cached;
}

export function resetClientEnvCache(): void {
  cached = null;
}
