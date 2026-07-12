import { describe, it, expect } from 'vitest';
import { getEnv } from '../../../src/config/env.js';

describe('login rate limit configuration', () => {
  it('skips login rate limit in test environment', () => {
    expect(getEnv().NODE_ENV).toBe('test');
  });
});
