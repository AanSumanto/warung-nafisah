import { LoyaltyLedgerEntry } from '../../../domain/loyalty/LoyaltyLedgerEntry.js';
import type {
  LoyaltyLedgerMetadata,
} from '../../../domain/loyalty/LoyaltyLedgerEntry.js';
import type { LoyaltyLedgerType, LoyaltySourceType } from '../../../domain/loyalty/LoyaltyLedgerTypes.js';
import { normalizeMongoId } from '../../persistence/normalizeMongoId.js';
import type { LoyaltyLedgerDocument } from '../documents/LoyaltyLedgerDocument.js';

function mapMetadata(raw: Record<string, unknown>, type: LoyaltyLedgerType): LoyaltyLedgerMetadata {
  if (type === 'REDEEM_REWARD' || raw.kind === 'REDEEM_REWARD') {
    return {
      kind: 'REDEEM_REWARD',
      orderId: String(raw.orderId ?? ''),
      rewardCode: String(raw.rewardCode ?? ''),
      rewardName: String(raw.rewardName ?? ''),
      pointsRequired: Number(raw.pointsRequired ?? 0),
      menuKode: String(raw.menuKode ?? ''),
      rewardHppSnapshot: Number(raw.rewardHppSnapshot ?? 0),
    };
  }
  return {
    kind: 'EARN_SALE',
    eligiblePaidAmount: Number(raw.eligiblePaidAmount ?? 0),
    orderId: String(raw.orderId ?? ''),
    paymentId: raw.paymentId ? String(raw.paymentId) : undefined,
    calculationVersion: String(raw.calculationVersion ?? 'v1'),
  };
}

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
    const type = document.type as LoyaltyLedgerType;
    return LoyaltyLedgerEntry.reconstitute(
      normalizeMongoId(document._id),
      {
        customerId: String(document.customerId),
        type,
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
        metadata: mapMetadata(document.metadata as Record<string, unknown>, type),
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
