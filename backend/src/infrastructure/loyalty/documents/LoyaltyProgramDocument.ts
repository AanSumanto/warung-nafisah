import { Schema, model, type Model } from 'mongoose';
import type { TimestampDocument } from '../../persistence/documents/BaseDocument.js';

export interface LoyaltyProgramDocument extends TimestampDocument {
  programCode: string;
  programName: string;
  enabled: boolean;
  pointEarnRate: number;
  version: number;
  effectiveFrom: Date;
  updatedBy: string;
}

const loyaltyProgramSchema = new Schema<LoyaltyProgramDocument>(
  {
    _id: { type: String, required: true },
    programCode: { type: String, required: true, unique: true },
    programName: { type: String, required: true },
    enabled: { type: Boolean, required: true, default: false },
    pointEarnRate: { type: Number, required: true },
    version: { type: Number, required: true },
    effectiveFrom: { type: Date, required: true },
    updatedBy: { type: String, required: true },
    createdAt: { type: Date, required: true },
    updatedAt: { type: Date, required: true },
  },
  { collection: 'loyalty_program', versionKey: false },
);

export function getLoyaltyProgramModel(): Model<LoyaltyProgramDocument> {
  return model<LoyaltyProgramDocument>('LoyaltyProgram', loyaltyProgramSchema);
}
