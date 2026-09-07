export const LOYALTY_LEDGER_TYPES = [
  'EARN_SALE',
  'REDEEM_REWARD',
  'REVERSAL_VOID',
  'REVERSAL_REFUND',
  'EXPIRY',
  'MANUAL_ADJUSTMENT',
] as const;

export type LoyaltyLedgerType = (typeof LOYALTY_LEDGER_TYPES)[number];

/** Runtime-implemented mutation types in LOYALTY-03. */
export const IMPLEMENTED_LEDGER_TYPES = ['EARN_SALE'] as const;

export const LOYALTY_SOURCE_TYPES = ['SALE'] as const;
export type LoyaltySourceType = (typeof LOYALTY_SOURCE_TYPES)[number];

export function buildEarnSaleIdempotencyKey(orderId: string): string {
  const id = orderId.trim();
  if (!id) {
    throw new Error('orderId is required for earn idempotency key');
  }
  return `LOYALTY:EARN_SALE:${id}`;
}
