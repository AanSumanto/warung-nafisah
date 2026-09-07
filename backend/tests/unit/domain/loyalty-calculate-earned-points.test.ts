import { describe, it, expect } from 'vitest';
import { calculateEarnedPoints } from '../../../src/domain/loyalty/calculateEarnedPoints.js';

describe('calculateEarnedPoints', () => {
  const rate = 5000;

  it.each([
    [0, 0],
    [3000, 0],
    [4999, 0],
    [5000, 1],
    [9999, 1],
    [10000, 2],
    [16000, 3],
    [17000, 3],
    [20000, 4],
    [23000, 4],
  ] as const)('amount %i → %i points at rate 5000', (amount, expected) => {
    expect(calculateEarnedPoints({ eligiblePaidAmount: amount, pointEarnRate: rate })).toBe(
      expected,
    );
  });

  it('uses supplied pointEarnRate (not hardcoded 5000)', () => {
    expect(calculateEarnedPoints({ eligiblePaidAmount: 20000, pointEarnRate: 10000 })).toBe(2);
  });

  it('rejects negative amount', () => {
    expect(() =>
      calculateEarnedPoints({ eligiblePaidAmount: -1, pointEarnRate: rate }),
    ).toThrow(/non-negative integer/);
  });

  it('rejects fractional Rupiah amount', () => {
    expect(() =>
      calculateEarnedPoints({ eligiblePaidAmount: 5000.5, pointEarnRate: rate }),
    ).toThrow(/non-negative integer/);
  });

  it('rejects rate 0', () => {
    expect(() =>
      calculateEarnedPoints({ eligiblePaidAmount: 5000, pointEarnRate: 0 }),
    ).toThrow(/positive integer/);
  });

  it('rejects negative rate', () => {
    expect(() =>
      calculateEarnedPoints({ eligiblePaidAmount: 5000, pointEarnRate: -5000 }),
    ).toThrow(/positive integer/);
  });

  it('rejects fractional rate', () => {
    expect(() =>
      calculateEarnedPoints({ eligiblePaidAmount: 5000, pointEarnRate: 5000.1 }),
    ).toThrow(/positive integer/);
  });
});
