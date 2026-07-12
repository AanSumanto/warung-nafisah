import { describe, expect, it } from 'vitest';
import {
  isCorsOriginAllowed,
  normalizeCorsOrigin,
  parseCorsOrigins,
} from '../../../src/config/cors-origins.js';

describe('parseCorsOrigins', () => {
  it('parses comma-separated origins', () => {
    const origins = parseCorsOrigins(
      'http://localhost:3000, https://warung-nafisah.vercel.app ,https://preview.vercel.app',
    );

    expect(origins).toEqual([
      'http://localhost:3000',
      'https://warung-nafisah.vercel.app',
      'https://preview.vercel.app',
    ]);
  });

  it('deduplicates origins', () => {
    const origins = parseCorsOrigins('http://localhost:3000,http://localhost:3000');
    expect(origins).toEqual(['http://localhost:3000']);
  });

  it('rejects wildcard origins', () => {
    expect(() => parseCorsOrigins('https://*.vercel.app')).toThrow(/wildcard/i);
  });

  it('rejects origins with path', () => {
    expect(() => parseCorsOrigins('https://warung-nafisah.vercel.app/login')).toThrow(/path/i);
  });
});

describe('isCorsOriginAllowed', () => {
  const allowed = ['http://localhost:3000', 'https://warung-nafisah.vercel.app'];

  it('allows localhost in development list', () => {
    expect(isCorsOriginAllowed('http://localhost:3000', allowed)).toBe(true);
  });

  it('allows production Vercel origin', () => {
    expect(isCorsOriginAllowed('https://warung-nafisah.vercel.app', allowed)).toBe(true);
  });

  it('rejects unknown origin', () => {
    expect(isCorsOriginAllowed('https://evil.example.com', allowed)).toBe(false);
  });

  it('rejects malformed origin', () => {
    expect(isCorsOriginAllowed('not-a-url', allowed)).toBe(false);
  });
});

describe('normalizeCorsOrigin', () => {
  it('normalizes origin without trailing slash', () => {
    expect(normalizeCorsOrigin('https://warung-nafisah.vercel.app/')).toBe(
      'https://warung-nafisah.vercel.app',
    );
  });
});
