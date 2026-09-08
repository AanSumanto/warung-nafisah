import { describe, it, expect } from 'vitest';
import {
  resolveLoyaltyDateRange,
  safePercent,
  startOfWibDay,
  endOfWibDay,
} from '../../../src/application/loyalty/loyaltyDateRange.js';

describe('loyaltyDateRange', () => {
  it('today bounds are Asia/Jakarta calendar day', () => {
    // 2026-09-08 01:00 UTC = 08:00 WIB
    const now = new Date('2026-09-08T01:00:00.000Z');
    const range = resolveLoyaltyDateRange({ preset: 'today', now });
    expect(range.timezone).toBe('Asia/Jakarta');
    expect(range.from.toISOString()).toBe(startOfWibDay(now).toISOString());
    expect(range.to.toISOString()).toBe(endOfWibDay(now).toISOString());
  });

  it('safePercent avoids NaN/Infinity', () => {
    expect(safePercent(1, 0)).toBeNull();
    expect(safePercent(2, 3)).toBe(66.67);
    expect(safePercent(1, 1)).toBe(100);
  });
});
