import { Schema, model, type Model } from 'mongoose';
import { SYSTEM_BOOTSTRAP_COLLECTION } from './bootstrapConstants.js';

export interface SystemBootstrapDocument {
  _id: string;
  version: string;
  installedAt: Date;
  seedVersion: string;
}

const systemBootstrapSchema = new Schema<SystemBootstrapDocument>(
  {
    _id: { type: String, required: true },
    version: { type: String, required: true },
    installedAt: { type: Date, required: true },
    seedVersion: { type: String, required: true },
  },
  { collection: SYSTEM_BOOTSTRAP_COLLECTION, versionKey: false },
);

export function getSystemBootstrapModel(): Model<SystemBootstrapDocument> {
  return model<SystemBootstrapDocument>('SystemBootstrap', systemBootstrapSchema);
}
