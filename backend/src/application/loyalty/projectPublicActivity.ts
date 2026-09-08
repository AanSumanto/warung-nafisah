import type { LoyaltyLedgerEntry } from '../../domain/loyalty/LoyaltyLedgerEntry.js';
import type { LoyaltyLedgerType } from '../../domain/loyalty/LoyaltyLedgerTypes.js';
import type { PublicActivityItem, PublicActivityType } from './PublicMemberRewardsDTO.js';

/** Fetch this many newest ledger rows, then filter to ≤ PUBLIC_ACTIVITY_LIMIT. */
export const PUBLIC_ACTIVITY_FETCH_BOUND = 25;
export const PUBLIC_ACTIVITY_LIMIT = 10;

const LABELS: Partial<Record<LoyaltyLedgerType, { type: PublicActivityType; label: string }>> = {
  EARN_SALE: { type: 'EARN', label: 'Belanja di Warung Nafisah' },
  REDEEM_REWARD: { type: 'REDEEM', label: 'Tukar reward' },
  REVERSAL_VOID: { type: 'ADJUSTMENT', label: 'Pembatalan transaksi' },
  REVERSAL_REFUND: { type: 'ADJUSTMENT', label: 'Penyesuaian poin refund' },
  EXPIRY: { type: 'ADJUSTMENT', label: 'Poin kedaluwarsa' },
  MANUAL_ADJUSTMENT: { type: 'ADJUSTMENT', label: 'Penyesuaian poin' },
};

/**
 * Presentation filter for public portal activity.
 * Zero-delta EARN_SALE is omitted (ledger retained internally).
 * Unknown types map to a generic safe label.
 */
export function projectPublicActivity(
  entries: readonly LoyaltyLedgerEntry[],
): PublicActivityItem[] {
  const out: PublicActivityItem[] = [];
  for (const entry of entries) {
    if (out.length >= PUBLIC_ACTIVITY_LIMIT) break;

    if (entry.type === 'EARN_SALE' && entry.pointsDelta === 0) {
      continue;
    }

    const mapped = LABELS[entry.type];
    const type = mapped?.type ?? 'OTHER';
    const label = mapped?.label ?? 'Perubahan poin';

    out.push({
      type,
      pointsDelta: entry.pointsDelta,
      occurredAt: entry.occurredAt.toISOString(),
      label,
    });
  }
  return out;
}
