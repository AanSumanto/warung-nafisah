/**
 * Asia/Jakarta (WIB, UTC+7) date-range helpers for loyalty analytics.
 * Avoids accidental UTC day boundaries on restaurant reporting.
 */

const WIB_OFFSET_MS = 7 * 60 * 60 * 1000;

export type LoyaltyDashboardPreset = 'today' | '7d' | '30d' | 'month' | 'custom';

export interface LoyaltyDateRange {
  readonly from: Date;
  readonly to: Date;
  readonly preset: LoyaltyDashboardPreset;
  readonly timezone: 'Asia/Jakarta';
}

function wibParts(d: Date): { y: number; m: number; day: number } {
  const shifted = new Date(d.getTime() + WIB_OFFSET_MS);
  return {
    y: shifted.getUTCFullYear(),
    m: shifted.getUTCMonth(),
    day: shifted.getUTCDate(),
  };
}

/** Start of calendar day in Asia/Jakarta as UTC Date. */
export function startOfWibDay(d: Date): Date {
  const { y, m, day } = wibParts(d);
  return new Date(Date.UTC(y, m, day, 0, 0, 0, 0) - WIB_OFFSET_MS);
}

/** End of calendar day in Asia/Jakarta as UTC Date (inclusive ms). */
export function endOfWibDay(d: Date): Date {
  const { y, m, day } = wibParts(d);
  return new Date(Date.UTC(y, m, day, 23, 59, 59, 999) - WIB_OFFSET_MS);
}

export function resolveLoyaltyDateRange(input: {
  readonly preset?: string;
  readonly from?: string;
  readonly to?: string;
  readonly now?: Date;
}): LoyaltyDateRange {
  const now = input.now ?? new Date();
  const preset = (input.preset ?? '30d') as LoyaltyDashboardPreset;

  if (preset === 'custom') {
    if (!input.from || !input.to) {
      throw new Error('CUSTOM_RANGE_REQUIRES_FROM_TO');
    }
    const from = startOfWibDay(new Date(input.from));
    const to = endOfWibDay(new Date(input.to));
    if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime()) || from > to) {
      throw new Error('INVALID_CUSTOM_RANGE');
    }
    return { from, to, preset: 'custom', timezone: 'Asia/Jakarta' };
  }

  if (preset === 'today') {
    return {
      from: startOfWibDay(now),
      to: endOfWibDay(now),
      preset: 'today',
      timezone: 'Asia/Jakarta',
    };
  }

  if (preset === '7d') {
    const fromDay = new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000);
    return {
      from: startOfWibDay(fromDay),
      to: endOfWibDay(now),
      preset: '7d',
      timezone: 'Asia/Jakarta',
    };
  }

  if (preset === 'month') {
    const { y, m } = wibParts(now);
    const first = new Date(Date.UTC(y, m, 1, 0, 0, 0, 0) - WIB_OFFSET_MS);
    return {
      from: first,
      to: endOfWibDay(now),
      preset: 'month',
      timezone: 'Asia/Jakarta',
    };
  }

  // default 30d inclusive
  const fromDay = new Date(now.getTime() - 29 * 24 * 60 * 60 * 1000);
  return {
    from: startOfWibDay(fromDay),
    to: endOfWibDay(now),
    preset: '30d',
    timezone: 'Asia/Jakarta',
  };
}

/** Safe percent: null when denominator is 0. Rounded to 2 decimals. */
export function safePercent(numerator: number, denominator: number): number | null {
  if (!Number.isFinite(numerator) || !Number.isFinite(denominator) || denominator === 0) {
    return null;
  }
  return Math.round((numerator / denominator) * 10000) / 100;
}
