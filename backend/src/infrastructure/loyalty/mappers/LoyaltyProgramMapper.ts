import { LoyaltyProgram } from '../../../domain/loyalty/LoyaltyProgram.js';
import { BaseMongoMapper } from '../../persistence/mappers/MongoMapper.js';
import type { LoyaltyProgramDocument } from '../documents/LoyaltyProgramDocument.js';

function asDate(value: unknown, field: string): Date {
  if (!(value instanceof Date) || Number.isNaN(value.getTime())) {
    throw new Error(`LoyaltyProgram document field ${field} is invalid`);
  }
  return value;
}

function asPositiveInt(value: unknown, field: string): number {
  if (typeof value !== 'number' || !Number.isInteger(value) || value < 1) {
    throw new Error(`LoyaltyProgram document field ${field} is invalid`);
  }
  return value;
}

export class LoyaltyProgramMapper extends BaseMongoMapper<LoyaltyProgram, LoyaltyProgramDocument> {
  toDocument(entity: LoyaltyProgram): LoyaltyProgramDocument {
    return {
      _id: entity.id,
      programCode: entity.programCode,
      programName: entity.programName,
      enabled: entity.enabled,
      pointEarnRate: entity.pointEarnRate,
      version: entity.version,
      effectiveFrom: entity.effectiveFrom,
      updatedBy: entity.updatedBy,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }

  toDomain(document: LoyaltyProgramDocument): LoyaltyProgram {
    return LoyaltyProgram.reconstitute(
      this.documentId(document),
      {
        programCode: String(document.programCode),
        programName: String(document.programName),
        enabled: Boolean(document.enabled),
        pointEarnRate: asPositiveInt(document.pointEarnRate, 'pointEarnRate'),
        version: asPositiveInt(document.version, 'version'),
        effectiveFrom: asDate(document.effectiveFrom, 'effectiveFrom'),
        updatedBy: String(document.updatedBy),
      },
      asDate(document.createdAt, 'createdAt'),
      asDate(document.updatedAt, 'updatedAt'),
    );
  }
}
