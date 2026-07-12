import { describe, it, expect, beforeEach } from 'vitest';
import { getClientEnv, resetClientEnvCache } from '@/shared/lib/env';

describe('getClientEnv', () => {
  beforeEach(() => {
    resetClientEnvCache();
    process.env.NEXT_PUBLIC_API_BASE_URL = 'http://localhost:5000';
    process.env.NEXT_PUBLIC_APP_NAME = 'Warung Nafisah ERP';
  });

  it('parses valid environment variables', () => {
    const env = getClientEnv();
    expect(env.NEXT_PUBLIC_API_BASE_URL).toBe('http://localhost:5000');
    expect(env.NEXT_PUBLIC_APP_NAME).toBe('Warung Nafisah ERP');
  });

  it('throws on invalid API URL', () => {
    process.env.NEXT_PUBLIC_API_BASE_URL = 'not-a-url';
    resetClientEnvCache();
    expect(() => getClientEnv()).toThrow(/Environment validation failed/);
  });
});
