import type { ILoyaltyRewardRepository } from '../../domain/loyalty/ILoyaltyRewardRepository.js';
import type { IMenuReferenceLookup } from './IMenuReferenceLookup.js';
import {
  buildLoyaltyReceiptProgress,
  type LoyaltyReceiptProgress,
} from './LoyaltyReceiptProgress.js';

/**
 * Builds receipt progress from live catalog + optional menu availability.
 * Does not implement redemption.
 */
export class LoyaltyReceiptProgressService {
  constructor(
    private readonly rewards: ILoyaltyRewardRepository,
    private readonly menus: IMenuReferenceLookup,
  ) {}

  async buildForBalance(balanceAfter: number): Promise<LoyaltyReceiptProgress> {
    const list = await this.rewards.listAll();
    const menuMap = await this.menus.findByKodeMenus(list.map((r) => r.menuKode));
    const inputs = list.map((reward) => ({
      rewardCode: reward.rewardCode,
      name: reward.name,
      pointsRequired: reward.pointsRequired,
      sortOrder: reward.sortOrder,
      status: reward.status,
      menuStatus: menuMap.get(reward.menuKode)?.status,
    }));
    return buildLoyaltyReceiptProgress(balanceAfter, inputs);
  }
}
