import { describe, expect, it } from 'vitest';
import { getSafeRedirectPath } from '@/shared/lib/safe-redirect';

describe('getSafeRedirectPath', () => {
  it('returns fallback for external URLs', () => {
    expect(getSafeRedirectPath('https://evil.com')).toBe('/pos');
  });

  it('returns fallback for protocol-relative paths', () => {
    expect(getSafeRedirectPath('//evil.com')).toBe('/pos');
  });

  it('allows internal paths', () => {
    expect(getSafeRedirectPath('/owner')).toBe('/owner');
  });
});
