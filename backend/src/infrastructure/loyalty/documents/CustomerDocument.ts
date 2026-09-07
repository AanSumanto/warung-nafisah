import { Schema, model, type Model } from 'mongoose';
import type { TimestampDocument } from '../../persistence/documents/BaseDocument.js';
import type { CustomerStatus } from '../../../domain/loyalty/LoyaltyTypes.js';

export interface CustomerDocument extends TimestampDocument {
  publicMemberId: string;
  phoneNormalized: string;
  phoneMasked: string;
  name?: string;
  currentPoints: number;
  lifetimeEarnedPoints: number;
  lifetimeRedeemedPoints: number;
  totalSpending: number;
  transactionCount: number;
  lastTransactionAt?: Date | null;
  status: CustomerStatus;
  registeredAt: Date;
  registeredBy: string;
}

const customerSchema = new Schema<CustomerDocument>(
  {
    _id: { type: String, required: true },
    publicMemberId: { type: String, required: true, unique: true },
    phoneNormalized: { type: String, required: true, unique: true },
    phoneMasked: { type: String, required: true },
    name: { type: String },
    currentPoints: { type: Number, required: true, default: 0 },
    lifetimeEarnedPoints: { type: Number, required: true, default: 0 },
    lifetimeRedeemedPoints: { type: Number, required: true, default: 0 },
    totalSpending: { type: Number, required: true, default: 0 },
    transactionCount: { type: Number, required: true, default: 0 },
    lastTransactionAt: { type: Date, default: null },
    status: { type: String, required: true, index: true },
    registeredAt: { type: Date, required: true },
    registeredBy: { type: String, required: true },
    createdAt: { type: Date, required: true },
    updatedAt: { type: Date, required: true },
  },
  { collection: 'customers', versionKey: false },
);

export function getCustomerModel(): Model<CustomerDocument> {
  return model<CustomerDocument>('Customer', customerSchema);
}
