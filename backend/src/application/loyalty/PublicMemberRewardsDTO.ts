/**
 * Customer-safe public portal DTO — allowlist only.
 * Never serialize Customer/Ledger documents directly.
 */

export type PublicProgramStatus = 'ACTIVE' | 'UNAVAILABLE';
export type PublicRewardAvailability = 'AVAILABLE' | 'TEMPORARILY_UNAVAILABLE';
export type PublicActivityType = 'EARN' | 'REDEEM' | 'ADJUSTMENT' | 'OTHER';

export interface PublicMemberIdentity {
  readonly displayName?: string;
  readonly phoneMasked: string;
}

export interface PublicMemberPoints {
  readonly current: number;
  readonly lifetimeEarned?: number;
}

export interface PublicNextReward {
  readonly rewardCode: string;
  readonly name: string;
  readonly pointsRequired: number;
  readonly pointsRemaining: number;
}

export interface PublicProgress {
  readonly eligibleRewardCount: number;
  readonly hasRedeemableReward: boolean;
  readonly nextReward?: PublicNextReward;
  readonly message: string;
}

export interface PublicRewardCard {
  readonly rewardCode: string;
  readonly name: string;
  readonly pointsRequired: number;
  readonly availability: PublicRewardAvailability;
  readonly eligible: boolean;
  readonly pointsRemaining?: number;
}

export interface PublicActivityItem {
  readonly type: PublicActivityType;
  readonly pointsDelta: number;
  readonly occurredAt: string;
  readonly label: string;
}

export interface PublicMemberRewardsDTO {
  readonly programStatus: PublicProgramStatus;
  /** Present when program unavailable but token is valid. */
  readonly message?: string;
  readonly member?: PublicMemberIdentity;
  readonly points?: PublicMemberPoints;
  readonly progress?: PublicProgress;
  readonly rewards?: readonly PublicRewardCard[];
  readonly recentActivity?: readonly PublicActivityItem[];
  /** Informational CTA — never triggers mutation. */
  readonly redemptionHint?: string;
}
