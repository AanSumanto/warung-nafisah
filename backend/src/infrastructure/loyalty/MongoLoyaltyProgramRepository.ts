import type { ClientSession, Model } from 'mongoose';
import type { Identifier } from '../../domain/common/Identifier.js';
import type { LoyaltyProgram } from '../../domain/loyalty/LoyaltyProgram.js';
import type { ILoyaltyProgramRepository } from '../../domain/loyalty/ILoyaltyProgramRepository.js';
import { FilterObject } from '../../application/common/Filter.js';
import { MongoRepository } from '../persistence/repositories/MongoRepository.js';
import type { LoyaltyProgramDocument } from './documents/LoyaltyProgramDocument.js';
import { LoyaltyProgramMapper } from './mappers/LoyaltyProgramMapper.js';

export class MongoLoyaltyProgramRepository implements ILoyaltyProgramRepository {
  private readonly repo: MongoRepository<LoyaltyProgram, LoyaltyProgramDocument>;

  constructor(
    model: Model<LoyaltyProgramDocument>,
    mapper: LoyaltyProgramMapper = new LoyaltyProgramMapper(),
    getActiveSession?: () => ClientSession | null,
  ) {
    this.repo = new MongoRepository(model, mapper, {}, getActiveSession);
  }

  save(program: LoyaltyProgram): Promise<LoyaltyProgram> {
    return this.repo.save(program);
  }

  findById(id: Identifier): Promise<LoyaltyProgram | null> {
    return this.repo.findById(id);
  }

  async findByProgramCode(programCode: string): Promise<LoyaltyProgram | null> {
    const results = await this.repo.findAll({
      filter: FilterObject.create().eq('programCode', programCode.trim().toUpperCase()).build(),
    });
    return results[0] ?? null;
  }
}
