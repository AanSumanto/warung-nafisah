import { LoyaltyLedgerEntry } from '../../../domain/loyalty/LoyaltyLedgerEntry.js';
import type { LoyaltyLedgerType, LoyaltySourceType } from '../../../domain/loyalty/LoyaltyLedgerTypes.js';
import { normalizeMongoId } from '../../persistence/normalizeMongoId.js';
import type { LoyaltyLedgerDocument } from '../documents/LoyaltyLedgerDocument.js';

export class LoyaltyLedgerMapper {
  toDocument(entity: LoyaltyLedgerEntry): LoyaltyLedgerDocument {
    return {
      _id: entity.id,
      customerId: entity.customerId,
      type: entity.type,
      pointsDelta: entity.pointsDelta,
      balanceAfter: entity.balanceAfter,
      sourceType: entity.sourceType,
      sourceId: entity.sourceId,
      idempotencyKey: entity.idempotencyKey,
      programSnapshot: { ...entity.programSnapshot },
      metadata: { ...entity.metadata },
      actor: { ...entity.actor },
      occurredAt: entity.occurredAt,
      createdAt: entity.createdAt,
      updatedAt: entity.createdAt,
    };
  }

  toDomain(document: LoyaltyLedgerDocument): LoyaltyLedgerEntry {
    return LoyaltyLedgerEntry.reconstitute(
      normalizeMongoId(document._id),
      {
        customerId: String(document.customerId),
        type: document.type as LoyaltyLedgerType,
        pointsDelta: document.pointsDelta,
        balanceAfter: document.balanceAfter,
        sourceType: document.sourceType as LoyaltySourceType,
        sourceId: String(document.sourceId),
        idempotencyKey: String(document.idempotencyKey),
        programSnapshot: {
          programCode: String(document.programSnapshot.programCode),
          programVersion: document.programSnapshot.programVersion,
          pointEarnRate: document.programSnapshot.pointEarnRate,
        },
        metadata: {
          eligiblePaidAmount: document.metadata.eligiblePaidAmount,
          orderId: String(document.metadata.orderId),
          paymentId: document.metadata.paymentId
            ? String(document.metadata.paymentId)
            : undefined,
          calculationVersion: String(document.metadata.calculationVersion),
        },
        actor: {
          type: document.actor.type,
          userId: document.actor.userId ? String(document.actor.userId) : undefined,
        },
        occurredAt: document.occurredAt,
      },
      document.createdAt,
    );
  }
}
