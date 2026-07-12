import { Schema, model, type Model } from 'mongoose';
import type { TimestampDocument } from '../../persistence/documents/BaseDocument.js';
import type { ShiftStatus } from '../../../domain/pos/PosTypes.js';

export interface ShiftDocument extends TimestampDocument {
  cashierId: string;
  cashierName: string;
  status: ShiftStatus;
  openingCash: number;
  closingCash?: number;
  openedAt: Date;
  closedAt?: Date;
}

const shiftSchema = new Schema<ShiftDocument>(
  {
    _id: { type: String, required: true },
    cashierId: { type: String, required: true, index: true },
    cashierName: { type: String, required: true },
    status: { type: String, required: true, index: true },
    openingCash: { type: Number, required: true },
    closingCash: { type: Number },
    openedAt: { type: Date, required: true },
    closedAt: { type: Date },
    createdAt: { type: Date, required: true },
    updatedAt: { type: Date, required: true },
  },
  { collection: 'shifts', versionKey: false },
);

export function getShiftModel(): Model<ShiftDocument> {
  return model<ShiftDocument>('Shift', shiftSchema);
}

export interface OrderSequenceDocument {
  _id: string;
  sequence: number;
  updatedAt: Date;
}

const orderSequenceSchema = new Schema<OrderSequenceDocument>(
  {
    _id: { type: String, required: true },
    sequence: { type: Number, required: true, default: 0 },
    updatedAt: { type: Date, required: true },
  },
  { collection: 'order_sequences', versionKey: false },
);

export function getOrderSequenceModel(): Model<OrderSequenceDocument> {
  return model<OrderSequenceDocument>('OrderSequence', orderSequenceSchema);
}
