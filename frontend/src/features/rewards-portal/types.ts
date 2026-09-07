export type PublicProgramStatus = 'ACTIVE' | 'UNAVAILABLE';
export type PublicRewardAvailability = 'AVAILABLE' | 'TEMPORARILY_UNAVAILABLE';
export type PublicActivityType = 'EARN' | 'REDEEM' | 'ADJUSTMENT' | 'OTHER';

export interface PublicMemberRewards {
  readonly programStatus: PublicProgramStatus;
  readonly message?: string;
  readonly member?: {
    readonly displayName?: string;
    readonly phoneMasked: string;
  };
  readonly points?: {
    readonly current: number;
    readonly lifetimeEarned?: number;
  };
  readonly progress?: {
    readonly eligibleRewardCount: number;
    readonly hasRedeemableReward: boolean;
    readonly nextReward?: {
      readonly rewardCode: string;
      readonly name: string;
      readonly pointsRequired: number;
      readonly pointsRemaining: number;
    };
    readonly message: string;
  };
  readonly rewards?: ReadonlyArray<{
    readonly rewardCode: string;
    readonly name: string;
    readonly pointsRequired: number;
    readonly availability: PublicRewardAvailability;
    readonly eligible: boolean;
    readonly pointsRemaining?: number;
  }>;
  readonly recentActivity?: ReadonlyArray<{
    readonly type: PublicActivityType;
    readonly pointsDelta: number;
    readonly occurredAt: string;
    readonly label: string;
  }>;
  readonly redemptionHint?: string;
}

export type PublicPortalFetchResult =
  | { readonly status: 'ok'; readonly data: PublicMemberRewards }
  | { readonly status: 'not_found' }
  | { readonly status: 'network' }
  | { readonly status: 'rate_limited' };
