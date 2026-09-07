export const CUSTOMER_STATUSES = ['active', 'blocked'] as const;
export type CustomerStatus = (typeof CUSTOMER_STATUSES)[number];

/** Reserved for a future merge sprint — not used in LOYALTY-01 behavior. */
export const CUSTOMER_STATUS_MERGED_RESERVED = 'merged' as const;

export const REWARD_STATUSES = ['active', 'inactive'] as const;
export type RewardStatus = (typeof REWARD_STATUSES)[number];

export const LOYALTY_PROGRAM_CODE = 'NAFISAH_REWARDS' as const;
export const LOYALTY_PROGRAM_NAME = 'Nafisah Rewards' as const;

/** Baseline earn rate: Rp eligible spending per 1 point. Config only — no earn engine yet. */
export const DEFAULT_POINT_EARN_RATE = 5_000;
