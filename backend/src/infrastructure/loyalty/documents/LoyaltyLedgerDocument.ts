import { Schema, model, type Model } from 'mongoose';
import type { TimestampDocument } from '../../persistence/documents/BaseDocument.js';
import type { LoyaltyLedgerType, LoyaltySourceType } from '../../../domain/loyalty/LoyaltyLedgerTypes.js';

export interface LoyaltyLedgerDocument extends TimestampDocument {
  customerId: string;
  type: LoyaltyLedgerType;
  pointsDelta: number;
  balanceAfter: number;
  sourceType: LoyaltySourceType;
  sourceId: string;
  idempotencyKey: string;
  programSnapshot: {
    programCode: string;
    programVersion: number;
    pointEarnRate: number;
  };
  metadata: {
    eligiblePaidAmount: number;
    orderId: string;
    paymentId?: string;
    calculationVersion: string;
  };
  actor: {
    type: 'SYSTEM' | 'USER';
    userId?: string;
  };
  occurredAt: Date;
}

const loyaltyLedgerSchema = new Schema<LoyaltyLedgerDocument>(
  {
    _id: { type: String, required: true },
    customerId: { type: String, required: true },
    type: { type: String, required: true },
    pointsDelta: { type: Number, required: true },
    balanceAfter: { type: Number, required: true },
    sourceType: { type: String, required: true },
    sourceId: { type: String, required: true },
    idempotencyKey: { type: String, required: true, unique: true },
    programSnapshot: {
      type: {
        programCode: { type: String, required: true },
        programVersion: { type: Number, required: true },
        pointEarnRate: { type: Number, required: true },
      },
      required: true,
      _id: false,
    },
    metadata: {
      type: {
        eligiblePaidAmount: { type: Number, required: true },
        orderId: { type: String, required: true },
        paymentId: { type: String },
        calculationVersion: { type: String, required: true },
      },
      required: true,
      _id: false,
    },
    actor: {
      type: new Schema(
        {
          type: { type: String, required: true },
          userId: { type: String },
        },
        { _id: false },
      ),
      required: true,
    },
    occurredAt: { type: Date, required: true },
    createdAt: { type: Date, required: true },
    updatedAt: { type: Date, required: true },
  },
  { collection: 'loyalty_ledger', versionKey: false },
);

loyaltyLedgerSchema.index({ customerId: 1, occurredAt: -1 });
loyaltyLedgerSchema.index({ sourceType: 1, sourceId: 1 });
loyaltyLedgerSchema.index({ customerId: 1, createdAt: -1 });

/** Soft schema guard — application must never mutate/delete ledger rows. */
loyaltyLedgerSchema.pre(
  [
    'updateOne',
    'updateMany',
    'findOneAndUpdate',
    'replaceOne',
    'deleteOne',
    'deleteMany',
    'findOneAndDelete',
    'findOneAndReplace',
  ],
  function () {
    throw new Error('loyalty_ledger is append-only; updates and deletes are forbidden');
  },
);

export function getLoyaltyLedgerModel(): Model<LoyaltyLedgerDocument> {
  return model<LoyaltyLedgerDocument>('LoyaltyLedger', loyaltyLedgerSchema);
}
