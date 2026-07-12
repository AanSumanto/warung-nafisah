import { BaseMongoMapper } from '../../persistence/mappers/MongoMapper.js';
import { Shift } from '../../../domain/pos/Shift.js';
import type { ShiftDocument } from '../documents/ShiftDocument.js';

export class ShiftMapper extends BaseMongoMapper<Shift, ShiftDocument> {
  toDocument(entity: Shift): ShiftDocument {
    return {
      _id: entity.id,
      cashierId: entity.cashierId,
      cashierName: entity.cashierName,
      status: entity.status,
      openingCash: entity.openingCash,
      closingCash: entity.closingCash,
      openedAt: entity.openedAt,
      closedAt: entity.closedAt,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }

  toDomain(document: ShiftDocument): Shift {
    return Shift.reconstitute(
      document._id,
      {
        cashierId: document.cashierId,
        cashierName: document.cashierName,
        status: document.status,
        openingCash: document.openingCash,
        closingCash: document.closingCash,
        openedAt: document.openedAt,
        closedAt: document.closedAt,
      },
      document.createdAt,
      document.updatedAt,
    );
  }
}
