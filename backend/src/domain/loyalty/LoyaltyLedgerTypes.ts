export const LOYALTY_LEDGER_TYPES = [
  'EARN_SALE',
  'REDEEM_REWARD',
  'REVERSAL_VOID',
  'REVERSAL_REFUND',
  'EXPIRY',
  'MANUAL_ADJUSTMENT',
] as const;

export type LoyaltyLedgerType = (typeof LOYALTY_LEDGER_TYPES)[number];

/** Runtime-implemented mutation types (append creators exist). */
export const IMPLEMENTED_LEDGER_TYPES = [
  'EARN_SALE',
  'REDEEM_REWARD',
  'REVERSAL_VOID',
  'REVERSAL_REFUND',
  'MANUAL_ADJUSTMENT',
] as const;

export const LOYALTY_SOURCE_TYPES = [
  'SALE',
  'REWARD_REDEMPTION',
  'REFUND',
  'VOID',
  'MANUAL',
] as const;
export type LoyaltySourceType = (typeof LOYALTY_SOURCE_TYPES)[number];

/** Fat-finger guard for owner manual adjustments (absolute points). */
export const MANUAL_ADJUSTMENT_ABS_MAX = 10_000;

export function buildEarnSaleIdempotencyKey(orderId: string): string {
  const id = orderId.trim();
  if (!id) {
    throw new Error('orderId is required for earn idempotency key');
  }
  return `LOYALTY:EARN_SALE:${id}`;
}

/** One reward redemption per order — key by orderId only. */
export function buildRedeemRewardIdempotencyKey(orderId: string): string {
  const id = orderId.trim();
  if (!id) {
    throw new Error('orderId is required for redeem idempotency key');
  }
  return `LOYALTY:REDEEM_REWARD:${id}`;
}

/**
 * Full refund/void of one earn: key by original earn ledger id.
 * When platform later supports multiple refund events, append :refundBusinessRef.
 */
export function buildReversalRefundIdempotencyKey(
  originalEarnLedgerId: string,
  refundBusinessRef?: string,
): string {
  const earnId = originalEarnLedgerId.trim();
  if (!earnId) {
    throw new Error('originalEarnLedgerId is required for refund reversal key');
  }
  const ref = refundBusinessRef?.trim();
  if (ref) {
    return `LOYALTY:REVERSAL_REFUND:${earnId}:${ref}`;
  }
  return `LOYALTY:REVERSAL_REFUND:${earnId}`;
}

export function buildReversalVoidIdempotencyKey(originalEarnLedgerId: string): string {
  const earnId = originalEarnLedgerId.trim();
  if (!earnId) {
    throw new Error('originalEarnLedgerId is required for void reversal key');
  }
  return `LOYALTY:REVERSAL_VOID:${earnId}`;
}

/**
 * Manual adjustment idempotency — keyed by client requestId only
 * so intentional identical deltas with different requestIds remain allowed.
 */
export function buildManualAdjustmentIdempotencyKey(requestId: string): string {
  const id = requestId.trim();
  if (!id) {
    throw new Error('requestId is required for manual adjustment key');
  }
  return `LOYALTY:MANUAL_ADJUSTMENT:${id}`;
}
