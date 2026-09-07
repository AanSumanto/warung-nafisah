import { Schema, model, type Model } from 'mongoose';
import type { TimestampDocument } from '../../persistence/documents/BaseDocument.js';
import type { RewardStatus } from '../../../domain/loyalty/LoyaltyTypes.js';

export interface LoyaltyRewardDocument extends TimestampDocument {
  rewardCode: string;
  name: string;
  menuKode: string;
  pointsRequired: number;
  hppEstimate: number;
  status: RewardStatus;
  sortOrder: number;
  version: number;
  updatedBy: string;
}

const loyaltyRewardSchema = new Schema<LoyaltyRewardDocument>(
  {
    _id: { type: String, required: true },
    rewardCode: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    menuKode: { type: String, required: true, index: true },
    pointsRequired: { type: Number, required: true },
    hppEstimate: { type: Number, required: true },
    status: { type: String, required: true, index: true },
    sortOrder: { type: Number, required: true },
    version: { type: Number, required: true },
    updatedBy: { type: String, required: true },
    createdAt: { type: Date, required: true },
    updatedAt: { type: Date, required: true },
  },
  { collection: 'loyalty_rewards', versionKey: false },
);

// Compound index for list-by-status ordering (justified by listRewards query)
loyaltyRewardSchema.index({ status: 1, sortOrder: 1 });

export function getLoyaltyRewardModel(): Model<LoyaltyRewardDocument> {
  return model<LoyaltyRewardDocument>('LoyaltyReward', loyaltyRewardSchema);
}
