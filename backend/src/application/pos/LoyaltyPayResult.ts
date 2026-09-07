import type { LoyaltyReceiptProgress } from '../loyalty/LoyaltyReceiptProgress.js';

export type LoyaltySkipReason =
  | 'NO_MEMBER'
  | 'PROGRAM_DISABLED'
  | 'CUSTOMER_BLOCKED'
  | 'CUSTOMER_NOT_FOUND';

/**
 * Authoritative loyalty outcome of a POS pay.
 * Frontend / ReceiptBuilder must not recalculate points.
 */
export interface LoyaltyRedemptionPaySnapshot {
  readonly rewardCode: string;
  readonly rewardName: string;
  readonly menuKode: string;
  readonly pointsUsed: number;
  readonly rewardHppSnapshot: number;
  readonly ledgerEntryId: string;
  readonly balanceAfter: number;
}

export interface LoyaltyPayResult {
  readonly memberAttached: boolean;
  readonly awarded: boolean;
  readonly reason?: LoyaltySkipReason;
  readonly customerId?: string;
  readonly phoneMasked?: string;
  readonly name?: string;
  readonly publicMemberId?: string;
  readonly pointsEarned?: number;
  readonly balanceAfter?: number;
  readonly eligiblePaidAmount?: number;
  readonly programCode?: string;
  readonly programVersion?: number;
  readonly pointEarnRate?: number;
  readonly ledgerEntryId?: string;
  readonly alreadyProcessed?: boolean;
  readonly receiptProgress?: LoyaltyReceiptProgress;
  /** Present only when receipt QR gate is enabled and PUBLIC_APP_URL is configured. */
  readonly memberPortalUrl?: string;
  readonly redemption?: LoyaltyRedemptionPaySnapshot;
}

export function loyaltyNoMember(): LoyaltyPayResult {
  return { memberAttached: false, awarded: false, reason: 'NO_MEMBER' };
}

export function loyaltySkipped(
  reason: Exclude<LoyaltySkipReason, 'NO_MEMBER'>,
  snapshot?: { customerId: string; phoneMasked: string; name?: string },
): LoyaltyPayResult {
  return {
    memberAttached: true,
    awarded: false,
    reason,
    customerId: snapshot?.customerId,
    phoneMasked: snapshot?.phoneMasked,
    name: snapshot?.name,
  };
}
