import type { Identifier } from '../common/Identifier.js';
import type { LoyaltyReward } from './LoyaltyReward.js';

export interface ILoyaltyRewardRepository {
  save(reward: LoyaltyReward): Promise<LoyaltyReward>;
  findById(id: Identifier): Promise<LoyaltyReward | null>;
  findByRewardCode(rewardCode: string): Promise<LoyaltyReward | null>;
  listAll(): Promise<LoyaltyReward[]>;
}
