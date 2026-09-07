import { LoyaltyReward } from '../../../domain/loyalty/LoyaltyReward.js';
import type { RewardStatus } from '../../../domain/loyalty/LoyaltyTypes.js';
import { BaseMongoMapper } from '../../persistence/mappers/MongoMapper.js';
import type { LoyaltyRewardDocument } from '../documents/LoyaltyRewardDocument.js';

function asDate(value: unknown, field: string): Date {
  if (!(value instanceof Date) || Number.isNaN(value.getTime())) {
    throw new Error(`LoyaltyReward document field ${field} is invalid`);
  }
  return value;
}

function asNonNegInt(value: unknown, field: string): number {
  if (typeof value !== 'number' || !Number.isInteger(value) || value < 0) {
    throw new Error(`LoyaltyReward document field ${field} is invalid`);
  }
  return value;
}

function asPositiveInt(value: unknown, field: string): number {
  if (typeof value !== 'number' || !Number.isInteger(value) || value < 1) {
    throw new Error(`LoyaltyReward document field ${field} is invalid`);
  }
  return value;
}

function asStatus(value: unknown): RewardStatus {
  if (value === 'active' || value === 'inactive') return value;
  throw new Error('LoyaltyReward document field status is invalid');
}

export class LoyaltyRewardMapper extends BaseMongoMapper<LoyaltyReward, LoyaltyRewardDocument> {
  toDocument(entity: LoyaltyReward): LoyaltyRewardDocument {
    return {
      _id: entity.id,
      rewardCode: entity.rewardCode,
      name: entity.name,
      menuKode: entity.menuKode,
      pointsRequired: entity.pointsRequired,
      hppEstimate: entity.hppEstimate,
      status: entity.status,
      sortOrder: entity.sortOrder,
      version: entity.version,
      updatedBy: entity.updatedBy,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }

  toDomain(document: LoyaltyRewardDocument): LoyaltyReward {
    return LoyaltyReward.reconstitute(
      this.documentId(document),
      {
        rewardCode: String(document.rewardCode),
        name: String(document.name),
        menuKode: String(document.menuKode),
        pointsRequired: asPositiveInt(document.pointsRequired, 'pointsRequired'),
        hppEstimate: asNonNegInt(document.hppEstimate, 'hppEstimate'),
        status: asStatus(document.status),
        sortOrder: asNonNegInt(document.sortOrder, 'sortOrder'),
        version: asPositiveInt(document.version, 'version'),
        updatedBy: String(document.updatedBy),
      },
      asDate(document.createdAt, 'createdAt'),
      asDate(document.updatedAt, 'updatedAt'),
    );
  }
}
