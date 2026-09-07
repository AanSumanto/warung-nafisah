import type { ClientSession, Model } from 'mongoose';
import type { Identifier } from '../../domain/common/Identifier.js';
import type { LoyaltyReward } from '../../domain/loyalty/LoyaltyReward.js';
import type { ILoyaltyRewardRepository } from '../../domain/loyalty/ILoyaltyRewardRepository.js';
import { FilterObject } from '../../application/common/Filter.js';
import { MongoRepository } from '../persistence/repositories/MongoRepository.js';
import type { LoyaltyRewardDocument } from './documents/LoyaltyRewardDocument.js';
import { LoyaltyRewardMapper } from './mappers/LoyaltyRewardMapper.js';

export class MongoLoyaltyRewardRepository implements ILoyaltyRewardRepository {
  private readonly repo: MongoRepository<LoyaltyReward, LoyaltyRewardDocument>;

  constructor(
    model: Model<LoyaltyRewardDocument>,
    mapper: LoyaltyRewardMapper = new LoyaltyRewardMapper(),
    getActiveSession?: () => ClientSession | null,
  ) {
    this.repo = new MongoRepository(model, mapper, {}, getActiveSession);
  }

  save(reward: LoyaltyReward): Promise<LoyaltyReward> {
    return this.repo.save(reward);
  }

  findById(id: Identifier): Promise<LoyaltyReward | null> {
    return this.repo.findById(id);
  }

  async findByRewardCode(rewardCode: string): Promise<LoyaltyReward | null> {
    const results = await this.repo.findAll({
      filter: FilterObject.create().eq('rewardCode', rewardCode.trim().toUpperCase()).build(),
    });
    return results[0] ?? null;
  }

  async listAll(): Promise<LoyaltyReward[]> {
    const results = await this.repo.findAll();
    return [...results].sort((a, b) => a.sortOrder - b.sortOrder || a.rewardCode.localeCompare(b.rewardCode));
  }
}
