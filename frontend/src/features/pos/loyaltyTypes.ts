export type LoyaltySkipReason =
  | 'NO_MEMBER'
  | 'PROGRAM_DISABLED'
  | 'CUSTOMER_BLOCKED'
  | 'CUSTOMER_NOT_FOUND';

export interface OrderCustomerSnapshot {
  readonly customerId: string;
  readonly phoneMasked: string;
  readonly name?: string;
}

export interface LoyaltyReceiptProgress {
  readonly eligibleRewardCount: number;
  readonly hasRedeemableThreshold: boolean;
  readonly nextReward?: {
    readonly rewardCode: string;
    readonly name: string;
    readonly pointsRequired: number;
    readonly pointsRemaining: number;
  };
  readonly progressMessage: string;
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
  readonly memberPortalUrl?: string;
  readonly redemption?: {
    readonly rewardCode: string;
    readonly rewardName: string;
    readonly menuKode: string;
    readonly pointsUsed: number;
    readonly rewardHppSnapshot: number;
    readonly ledgerEntryId: string;
    readonly balanceAfter: number;
  };
}

export interface CashierRewardOption {
  readonly rewardCode: string;
  readonly name: string;
  readonly pointsRequired: number;
  readonly eligible: boolean;
  readonly availability: 'AVAILABLE' | 'TEMPORARILY_UNAVAILABLE';
  readonly pointsRemaining?: number;
}

export interface OrderRewardsResponse {
  readonly currentPoints: number;
  readonly phoneMasked: string;
  readonly name?: string;
  readonly selectedRewardCode?: string;
  readonly rewards: readonly CashierRewardOption[];
}

export interface CustomerSummary {
  readonly id: string;
  readonly phoneMasked: string;
  readonly name?: string;
  readonly status: string;
  readonly currentPoints: number;
}

export interface PosMemberSelection {
  readonly customerId: string;
  readonly phoneMasked: string;
  readonly name?: string;
}
