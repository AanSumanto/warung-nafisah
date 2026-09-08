import { apiClient } from '@/shared/lib/api';
import type { ApiSuccessResponse } from '@/types/api';

export interface LoyaltyDashboard {
  readonly range: {
    readonly from: string;
    readonly to: string;
    readonly preset: string;
    readonly timezone: string;
  };
  readonly members: {
    readonly totalRegistered: number;
    readonly activeInRange: number;
    readonly negativeBalanceCount: number;
  };
  readonly points: {
    readonly earnedInRange: number;
    readonly redeemedInRange: number;
    readonly reversedInRange: number;
    readonly manualPositiveInRange: number;
    readonly manualNegativeInRange: number;
    readonly manualNetInRange: number;
    readonly redemptionRatePoints: number | null;
    readonly netOutstanding: number;
    readonly positiveOutstanding: number;
    readonly negativeDeficit: number;
  };
  readonly cost: {
    readonly rewardHppCostInRange: number;
    readonly eligibleMemberSalesInRange: number;
    readonly loyaltyCostPercent: number | null;
    readonly note: string;
  };
  readonly sales: {
    readonly memberOrderCount: number;
    readonly memberSalesAmount: number;
    readonly memberAov: number | null;
    readonly nonMemberOrderCount: number;
    readonly nonMemberSalesAmount: number;
    readonly nonMemberAov: number | null;
  };
  readonly repeat: {
    readonly activeMembers: number;
    readonly repeatMembers: number;
    readonly repeatRatePercent: number | null;
  };
  readonly topRewards: ReadonlyArray<{
    readonly rewardCode: string;
    readonly rewardName: string;
    readonly redemptionCount: number;
    readonly pointsSpent: number;
    readonly hppCost: number;
    readonly shareOfRedemptionsPercent: number | null;
  }>;
  readonly recentManualAdjustments: ReadonlyArray<{
    readonly occurredAt: string;
    readonly customerId: string;
    readonly pointsDelta: number;
    readonly reason: string;
    readonly actorUserId: string;
  }>;
  readonly limitations: readonly string[];
}

export interface AdminMemberHit {
  readonly customerId: string;
  readonly name?: string;
  readonly phoneMasked: string;
  readonly currentPoints: number;
  readonly status: string;
}

export interface AdminMemberDetail {
  readonly customerId: string;
  readonly publicMemberId: string;
  readonly name?: string;
  readonly phoneMasked: string;
  readonly currentPoints: number;
  readonly lifetimeEarnedPoints: number;
  readonly lifetimeRedeemedPoints: number;
  readonly totalSpending: number;
  readonly totalSpendingLabel: string;
  readonly transactionCount: number;
  readonly transactionCountLabel: string;
  readonly registeredAt: string;
  readonly lastTransactionAt: string | null;
  readonly status: string;
  readonly redemptionSummary: {
    readonly redeemCount: number;
    readonly pointsRedeemed: number;
    readonly hppCost: number;
  };
  readonly manualAdjustmentCount: number;
}

export interface AdminLedgerItem {
  readonly id: string;
  readonly type: string;
  readonly pointsDelta: number;
  readonly balanceAfter: number;
  readonly occurredAt: string;
  readonly summary: string;
  readonly actorUserId?: string;
  readonly reason?: string;
}

export async function fetchLoyaltyDashboard(preset: string): Promise<LoyaltyDashboard> {
  const res = await apiClient.get<ApiSuccessResponse<LoyaltyDashboard>>(
    '/admin/loyalty/dashboard',
    { params: { preset } },
  );
  return res.data.data;
}

export async function fetchAdminAdjustmentGate(): Promise<boolean> {
  const res = await apiClient.get<ApiSuccessResponse<{ adminAdjustmentEnabled: boolean }>>(
    '/admin/loyalty/gates',
  );
  return res.data.data.adminAdjustmentEnabled;
}

export async function searchAdminMembers(q: string): Promise<AdminMemberHit[]> {
  const res = await apiClient.get<ApiSuccessResponse<{ items: AdminMemberHit[] }>>(
    '/admin/loyalty/customers/search',
    { params: { q } },
  );
  return res.data.data.items;
}

export async function fetchAdminMemberDetail(customerId: string): Promise<AdminMemberDetail> {
  const res = await apiClient.get<ApiSuccessResponse<AdminMemberDetail>>(
    `/admin/loyalty/customers/${customerId}`,
  );
  return res.data.data;
}

export async function fetchAdminMemberLedger(customerId: string): Promise<AdminLedgerItem[]> {
  const res = await apiClient.get<
    ApiSuccessResponse<{ items: AdminLedgerItem[]; nextCursor: string | null }>
  >(`/admin/loyalty/customers/${customerId}/ledger`);
  return res.data.data.items;
}

export async function verifyAdminMemberBalance(customerId: string): Promise<{
  status: 'MATCH' | 'MISMATCH';
  cachedPoints: number;
  ledgerSum: number;
}> {
  const res = await apiClient.post<
    ApiSuccessResponse<{
      status: 'MATCH' | 'MISMATCH';
      cachedPoints: number;
      ledgerSum: number;
    }>
  >(`/admin/loyalty/customers/${customerId}/verify-balance`);
  return res.data.data;
}

export async function postManualAdjustment(
  customerId: string,
  body: {
    pointsDelta: number;
    reason: string;
    note?: string;
    requestId: string;
  },
): Promise<{
  adjustmentId: string;
  pointsDelta: number;
  balanceAfter: number;
  alreadyProcessed: boolean;
}> {
  const res = await apiClient.post<
    ApiSuccessResponse<{
      adjustmentId: string;
      pointsDelta: number;
      balanceAfter: number;
      alreadyProcessed: boolean;
    }>
  >(`/admin/loyalty/customers/${customerId}/adjustments`, body);
  return res.data.data;
}

export function newAdjustmentRequestId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID().replace(/-/g, '').slice(0, 24);
  }
  return `req${Date.now()}${Math.floor(Math.random() * 1e6)}`;
}
