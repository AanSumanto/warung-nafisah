import { Schema, model, type Model } from 'mongoose';
import type { TimestampDocument } from '../../persistence/documents/BaseDocument.js';
import type { DiningType, MenuType, OrderStatus, PaymentMethod } from '../../../domain/pos/PosTypes.js';

export interface OrderItemEmbedded {
  _id: string;
  kodeMenu: string;
  namaMenu: string;
  kodeKategori: string;
  namaKategori: string;
  tipeMenu: MenuType;
  hargaJual: number;
  qty: number;
  subtotal: number;
  note?: string;
}

export interface OrderDocument extends TimestampDocument {
  orderNumber: string;
  status: OrderStatus;
  diningType: DiningType;
  cashierId: string;
  cashierName: string;
  shiftId?: string;
  items: OrderItemEmbedded[];
  total: number;
  paymentMethod?: PaymentMethod;
  paidAmount?: number;
  changeAmount?: number;
  paidAt?: Date;
}

const orderItemSchema = new Schema<OrderItemEmbedded>(
  {
    _id: { type: String, required: true },
    kodeMenu: { type: String, required: true },
    namaMenu: { type: String, required: true },
    kodeKategori: { type: String, required: true },
    namaKategori: { type: String, required: true },
    tipeMenu: { type: String, required: true },
    hargaJual: { type: Number, required: true },
    qty: { type: Number, required: true },
    subtotal: { type: Number, required: true },
    note: { type: String },
  },
  { _id: false },
);

const orderSchema = new Schema<OrderDocument>(
  {
    _id: { type: String, required: true },
    orderNumber: { type: String, required: true, unique: true, index: true },
    status: { type: String, required: true, index: true },
    diningType: { type: String, required: true },
    cashierId: { type: String, required: true, index: true },
    cashierName: { type: String, required: true },
    shiftId: { type: String, index: true },
    items: { type: [orderItemSchema], default: [] },
    total: { type: Number, required: true, default: 0 },
    paymentMethod: { type: String },
    paidAmount: { type: Number },
    changeAmount: { type: Number },
    paidAt: { type: Date, index: true },
    createdAt: { type: Date, required: true },
    updatedAt: { type: Date, required: true },
  },
  { collection: 'orders', versionKey: false },
);

export function getOrderModel(): Model<OrderDocument> {
  return model<OrderDocument>('Order', orderSchema);
}
