import { Schema, model, type Model } from 'mongoose';
import type { TimestampDocument } from '../../persistence/documents/BaseDocument.js';
import type { BundleComponent, MenuCategoryCode, MenuStatus, MenuType } from '../../../domain/pos/PosTypes.js';

export interface MenuDocument extends TimestampDocument {
  kodeMenu: string;
  namaMenu: string;
  tipeMenu: MenuType;
  kodeKategori: MenuCategoryCode;
  namaKategori: string;
  hargaJual: number;
  status: MenuStatus;
  sellingTime?: string;
  bundleItems?: BundleComponent[];
}

const bundleComponentSchema = new Schema<BundleComponent>(
  {
    kodeMenu: { type: String, required: true },
    qty: { type: Number, required: true },
  },
  { _id: false },
);

const menuSchema = new Schema<MenuDocument>(
  {
    _id: { type: String, required: true },
    kodeMenu: { type: String, required: true, unique: true, index: true },
    namaMenu: { type: String, required: true, index: true },
    tipeMenu: { type: String, required: true, index: true },
    kodeKategori: { type: String, required: true, index: true },
    namaKategori: { type: String, required: true },
    hargaJual: { type: Number, required: true },
    status: { type: String, required: true, index: true },
    sellingTime: { type: String },
    bundleItems: { type: [bundleComponentSchema], default: undefined },
    createdAt: { type: Date, required: true },
    updatedAt: { type: Date, required: true },
  },
  { collection: 'menus', versionKey: false },
);

export function getMenuModel(): Model<MenuDocument> {
  return model<MenuDocument>('Menu', menuSchema);
}
