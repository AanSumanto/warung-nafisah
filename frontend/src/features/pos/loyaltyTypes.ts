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

export interface LoyaltyPayResult {
  readonly memberAttached: boolean;
  readonly awarded: boolean;
  readonly reason?: LoyaltySkipReason;
  readonly customerId?: string;
  readonly phoneMasked?: string;
  readonly name?: string;
  readonly pointsEarned?: number;
  readonly balanceAfter?: number;
  readonly eligiblePaidAmount?: number;
  readonly programCode?: string;
  readonly programVersion?: number;
  readonly pointEarnRate?: number;
  readonly ledgerEntryId?: string;
  readonly alreadyProcessed?: boolean;
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
