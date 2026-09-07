import { describe, expect, it } from 'vitest';
import {
  generatePublicMemberId,
  isUrlSafePublicMemberId,
} from '../../../src/domain/loyalty/publicMemberId.js';

describe('generatePublicMemberId', () => {
  it('generates non-empty URL-safe tokens', () => {
    const id = generatePublicMemberId();
    expect(id.length).toBe(32);
    expect(isUrlSafePublicMemberId(id)).toBe(true);
    expect(id).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it('is not phone-derived', () => {
    const id = generatePublicMemberId();
    expect(id.includes('0812')).toBe(false);
    expect(id.includes('6281')).toBe(false);
  });

  it('produces unique values in a reasonable sample', () => {
    const ids = new Set<string>();
    for (let i = 0; i < 200; i++) {
      ids.add(generatePublicMemberId());
    }
    expect(ids.size).toBe(200);
  });
});
