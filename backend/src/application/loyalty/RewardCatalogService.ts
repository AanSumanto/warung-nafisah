import { randomUUID } from 'node:crypto';
import {
  NotFoundException,
  ValidationException,
} from '../../core/exceptions/BaseException.js';
import { DomainError } from '../../domain/errors/DomainError.js';
import { LoyaltyReward } from '../../domain/loyalty/LoyaltyReward.js';
import type { ILoyaltyRewardRepository } from '../../domain/loyalty/ILoyaltyRewardRepository.js';
import type { RewardStatus } from '../../domain/loyalty/LoyaltyTypes.js';
import type { IMenuReferenceLookup } from './IMenuReferenceLookup.js';

export interface LoyaltyRewardDto {
  readonly id: string;
  readonly rewardCode: string;
  readonly name: string;
  readonly menuKode: string;
  readonly pointsRequired: number;
  readonly hppEstimate: number;
  readonly status: string;
  readonly sortOrder: number;
  readonly version: number;
  readonly updatedAt: string;
}

function toValidation(error: unknown): never {
  if (error instanceof DomainError) {
    throw new ValidationException(error.message, error.field ? { field: error.field } : undefined);
  }
  throw error;
}

function isDuplicateKeyError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const code = (error as { code?: number }).code;
  if (code === 11000) return true;
  const message = error instanceof Error ? error.message : String(error);
  return message.includes('E11000') || message.includes('duplicate key');
}

export function toLoyaltyRewardDto(reward: LoyaltyReward): LoyaltyRewardDto {
  return {
    id: reward.id,
    rewardCode: reward.rewardCode,
    name: reward.name,
    menuKode: reward.menuKode,
    pointsRequired: reward.pointsRequired,
    hppEstimate: reward.hppEstimate,
    status: reward.status,
    sortOrder: reward.sortOrder,
    version: reward.version,
    updatedAt: reward.updatedAt.toISOString(),
  };
}

export class RewardCatalogService {
  constructor(
    private readonly rewards: ILoyaltyRewardRepository,
    private readonly menus: IMenuReferenceLookup,
  ) {}

  async listRewards(): Promise<LoyaltyRewardDto[]> {
    const list = await this.rewards.listAll();
    return list.map(toLoyaltyRewardDto);
  }

  async getReward(rewardCode: string): Promise<LoyaltyRewardDto> {
    const reward = await this.rewards.findByRewardCode(rewardCode);
    if (!reward) {
      throw new NotFoundException('Reward tidak ditemukan', {
        code: 'LOYALTY_REWARD_NOT_FOUND',
      });
    }
    return toLoyaltyRewardDto(reward);
  }

  private async assertMenuExists(menuKode: string): Promise<void> {
    const menu = await this.menus.findByKodeMenu(menuKode);
    if (!menu) {
      throw new ValidationException(`Menu ${menuKode.trim().toUpperCase()} tidak ditemukan`, {
        code: 'LOYALTY_REWARD_MENU_NOT_FOUND',
        field: 'menuKode',
      });
    }
    // sold_out / available / hidden all allowed for catalog storage;
    // redemption (LOYALTY-07) will enforce runtime availability.
  }

  async createReward(input: {
    rewardCode: string;
    name: string;
    menuKode: string;
    pointsRequired: number;
    hppEstimate: number;
    sortOrder: number;
    status?: RewardStatus;
    updatedBy: string;
  }): Promise<LoyaltyRewardDto> {
    await this.assertMenuExists(input.menuKode);

    const existing = await this.rewards.findByRewardCode(input.rewardCode);
    if (existing) {
      throw new ValidationException('rewardCode sudah digunakan', {
        code: 'LOYALTY_REWARD_ALREADY_EXISTS',
      });
    }

    let reward: LoyaltyReward;
    try {
      reward = LoyaltyReward.create({
        id: randomUUID(),
        rewardCode: input.rewardCode,
        name: input.name,
        menuKode: input.menuKode,
        pointsRequired: input.pointsRequired,
        hppEstimate: input.hppEstimate,
        sortOrder: input.sortOrder,
        status: input.status,
        updatedBy: input.updatedBy,
      });
    } catch (error) {
      toValidation(error);
    }

    try {
      const saved = await this.rewards.save(reward);
      return toLoyaltyRewardDto(saved);
    } catch (error) {
      if (isDuplicateKeyError(error)) {
        throw new ValidationException('rewardCode sudah digunakan', {
          code: 'LOYALTY_REWARD_ALREADY_EXISTS',
        });
      }
      throw error;
    }
  }

  async updateReward(
    rewardCode: string,
    input: {
      name?: string;
      menuKode?: string;
      pointsRequired?: number;
      hppEstimate?: number;
      sortOrder?: number;
      status?: RewardStatus;
      updatedBy: string;
    },
  ): Promise<LoyaltyRewardDto> {
    const reward = await this.rewards.findByRewardCode(rewardCode);
    if (!reward) {
      throw new NotFoundException('Reward tidak ditemukan', {
        code: 'LOYALTY_REWARD_NOT_FOUND',
      });
    }

    if (input.menuKode !== undefined) {
      await this.assertMenuExists(input.menuKode);
    }

    let updated: LoyaltyReward;
    try {
      updated = reward.update(input);
    } catch (error) {
      toValidation(error);
    }

    const saved = await this.rewards.save(updated);
    return toLoyaltyRewardDto(saved);
  }
}
