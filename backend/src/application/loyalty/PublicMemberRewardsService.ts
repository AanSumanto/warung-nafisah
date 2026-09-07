import type { ICustomerRepository } from '../../domain/loyalty/ICustomerRepository.js';
import type { ILoyaltyLedgerRepository } from '../../domain/loyalty/ILoyaltyLedgerRepository.js';
import type { ILoyaltyProgramRepository } from '../../domain/loyalty/ILoyaltyProgramRepository.js';
import type { ILoyaltyRewardRepository } from '../../domain/loyalty/ILoyaltyRewardRepository.js';
import { LOYALTY_PROGRAM_CODE } from '../../domain/loyalty/LoyaltyTypes.js';
import { isUrlSafePublicMemberId } from '../../domain/loyalty/publicMemberId.js';
import { NotFoundException } from '../../core/exceptions/BaseException.js';
import type { IMenuReferenceLookup } from './IMenuReferenceLookup.js';
import { buildLoyaltyReceiptProgress } from './LoyaltyReceiptProgress.js';
import type {
  PublicMemberRewardsDTO,
  PublicRewardAvailability,
  PublicRewardCard,
} from './PublicMemberRewardsDTO.js';
import {
  PUBLIC_ACTIVITY_FETCH_BOUND,
  projectPublicActivity,
} from './projectPublicActivity.js';

const GENERIC_NOT_FOUND = 'Member tidak ditemukan';
const PROGRAM_UNAVAILABLE_MESSAGE = 'Nafisah Rewards sedang belum tersedia.';
const REDEMPTION_HINT = 'Tunjukkan halaman ini kepada kasir untuk menggunakan reward.';

/**
 * Aggregates current member loyalty state for the public portal.
 * Read-only — never mutates points or ledger.
 */
export class PublicMemberRewardsService {
  constructor(
    private readonly customers: ICustomerRepository,
    private readonly programs: ILoyaltyProgramRepository,
    private readonly rewards: ILoyaltyRewardRepository,
    private readonly menus: IMenuReferenceLookup,
    private readonly ledger: ILoyaltyLedgerRepository,
  ) {}

  async getByPublicToken(token: string): Promise<PublicMemberRewardsDTO> {
    // Invalid format → same generic 404 as unknown (enumeration resistance)
    if (!isUrlSafePublicMemberId(token)) {
      throw new NotFoundException(GENERIC_NOT_FOUND);
    }

    const customer = await this.customers.findByPublicMemberId(token);
    if (!customer || !customer.isActive()) {
      throw new NotFoundException(GENERIC_NOT_FOUND);
    }

    const member = {
      displayName: customer.name,
      phoneMasked: customer.phoneMasked,
    };

    const program = await this.programs.findByProgramCode(LOYALTY_PROGRAM_CODE);
    if (!program || !program.enabled) {
      return {
        programStatus: 'UNAVAILABLE',
        message: PROGRAM_UNAVAILABLE_MESSAGE,
        member,
      };
    }

    const currentPoints = customer.currentPoints;
    const allRewards = await this.rewards.listAll();
    const active = allRewards
      .filter((r) => r.status === 'active')
      .slice()
      .sort((a, b) => a.sortOrder - b.sortOrder || a.rewardCode.localeCompare(b.rewardCode));

    const menuMap = await this.menus.findByKodeMenus(active.map((r) => r.menuKode));

    const progressInputs = active.map((reward) => ({
      rewardCode: reward.rewardCode,
      name: reward.name,
      pointsRequired: reward.pointsRequired,
      sortOrder: reward.sortOrder,
      status: reward.status,
      menuStatus: menuMap.get(reward.menuKode)?.status,
    }));

    const progressCore = buildLoyaltyReceiptProgress(currentPoints, progressInputs);

    const publicRewards: PublicRewardCard[] = [];
    for (const reward of active) {
      const menu = menuMap.get(reward.menuKode);
      const menuStatus = menu?.status;

      // Hidden menu → omit from public catalog (not ready for customers)
      if (menuStatus === 'hidden') continue;

      const availability: PublicRewardAvailability =
        menuStatus === 'available' ? 'AVAILABLE' : 'TEMPORARILY_UNAVAILABLE';

      const eligible = currentPoints >= reward.pointsRequired;
      const pointsRemaining = eligible
        ? undefined
        : Math.max(0, reward.pointsRequired - currentPoints);

      publicRewards.push({
        rewardCode: reward.rewardCode,
        name: reward.name,
        pointsRequired: reward.pointsRequired,
        availability,
        eligible,
        pointsRemaining,
      });
    }

    // Eligible count for portal: points-eligible among public-visible cards
    const eligibleVisible = publicRewards.filter((r) => r.eligible).length;

    const recentRaw = await this.ledger.listRecentByCustomer(
      String(customer.id),
      PUBLIC_ACTIVITY_FETCH_BOUND,
    );
    const recentActivity = projectPublicActivity(recentRaw);

    return {
      programStatus: 'ACTIVE',
      member,
      points: {
        current: currentPoints,
        lifetimeEarned: customer.lifetimeEarnedPoints,
      },
      progress: {
        eligibleRewardCount: eligibleVisible,
        hasRedeemableReward: eligibleVisible > 0,
        nextReward: progressCore.nextReward,
        message: progressCore.progressMessage,
      },
      rewards: publicRewards,
      recentActivity,
      redemptionHint: REDEMPTION_HINT,
    };
  }
}
