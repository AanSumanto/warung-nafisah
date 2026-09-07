export interface LoyaltyReceiptNextReward {
  readonly rewardCode: string;
  readonly name: string;
  readonly pointsRequired: number;
  readonly pointsRemaining: number;
}

export interface LoyaltyReceiptProgress {
  readonly eligibleRewardCount: number;
  readonly hasRedeemableThreshold: boolean;
  /** Deterministic next locked reward by sortOrder; omitted if none. */
  readonly nextReward?: LoyaltyReceiptNextReward;
  /**
   * Compact Indonesian progress line for 58mm.
   * Never contains negative remaining points.
   */
  readonly progressMessage: string;
}

export interface RewardProgressInput {
  readonly rewardCode: string;
  readonly name: string;
  readonly pointsRequired: number;
  readonly sortOrder: number;
  readonly status: string;
  /** Menu status when known — hidden rewards are skipped for next nomination. */
  readonly menuStatus?: string;
}

/**
 * Pure, authoritative receipt progress from balance + catalog.
 * Does not hardcode 15/30/45/... thresholds.
 */
export function buildLoyaltyReceiptProgress(
  balanceAfter: number,
  rewards: readonly RewardProgressInput[],
): LoyaltyReceiptProgress {
  if (!Number.isInteger(balanceAfter) || balanceAfter < 0) {
    throw new Error('balanceAfter must be a non-negative integer');
  }

  const active = rewards
    .filter((r) => r.status === 'active')
    .slice()
    .sort((a, b) => a.sortOrder - b.sortOrder || a.rewardCode.localeCompare(b.rewardCode));

  const eligible = active.filter((r) => r.pointsRequired <= balanceAfter);
  const hasRedeemableThreshold = eligible.length > 0;

  const candidates = active.filter((r) => {
    if (r.pointsRequired <= balanceAfter) return false;
    if (r.menuStatus === 'hidden') return false;
    // Prefer available menus for next-reward promise; sold_out stays in catalog only
    if (r.menuStatus === 'sold_out') return false;
    return true;
  });

  const next = candidates[0];
  let nextReward: LoyaltyReceiptNextReward | undefined;
  let progressMessage: string;

  if (next) {
    const sameThreshold = candidates.filter((r) => r.pointsRequired === next.pointsRequired);
    const pointsRemaining = next.pointsRequired - balanceAfter;
    nextReward = {
      rewardCode: next.rewardCode,
      name: next.name,
      pointsRequired: next.pointsRequired,
      pointsRemaining,
    };

    if (sameThreshold.length > 1) {
      progressMessage = `Tinggal ${pointsRemaining} poin lagi untuk reward ${next.pointsRequired} poin`;
    } else {
      progressMessage = `Tinggal ${pointsRemaining} poin lagi untuk Gratis ${next.name}`;
    }
  } else if (hasRedeemableThreshold) {
    progressMessage = 'Kamu sudah bisa tukar reward!';
  } else {
    progressMessage = 'Kumpulkan poin untuk tukar reward';
  }

  // Above max catalog threshold with redeemable rewards
  if (!next && hasRedeemableThreshold && balanceAfter >= (active.at(-1)?.pointsRequired ?? 0)) {
    progressMessage = 'Reward tersedia — cek pilihan reward';
  }

  return {
    eligibleRewardCount: eligible.length,
    hasRedeemableThreshold,
    nextReward,
    progressMessage,
  };
}
