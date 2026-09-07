import { describe, it, expect } from 'vitest';
import { formatPointsDelta, formatPortalDate, memberGreeting } from '@/features/rewards-portal/format';

describe('rewards portal format helpers', () => {
  it('formats greeting and points without exposing null', () => {
    expect(memberGreeting('Aan')).toBe('Halo, Aan');
    expect(memberGreeting(undefined)).toBe('Halo, Member Nafisah');
    expect(memberGreeting('  ')).toBe('Halo, Member Nafisah');
    expect(formatPointsDelta(4)).toBe('+4 poin');
    expect(formatPointsDelta(-2)).toBe('-2 poin');
  });

  it('formats Indonesian dates', () => {
    const label = formatPortalDate('2026-09-07T10:30:00.000Z');
    expect(label).toMatch(/2026/);
    expect(label).toMatch(/Sep|September|9/i);
  });
});
