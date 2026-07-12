import { Schema, model, type Model } from 'mongoose';
import type { TimestampDocument } from '../../persistence/documents/BaseDocument.js';
import type { MenuType, PaymentMethod } from '../../../domain/pos/PosTypes.js';

export interface OrderItemDocument extends TimestampDocument {
  orderId: string;
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

const orderItemSchema = new Schema<OrderItemDocument>(
  {
    _id: { type: String, required: true },
    orderId: { type: String, required: true, index: true },
    kodeMenu: { type: String, required: true, index: true },
    namaMenu: { type: String, required: true },
    kodeKategori: { type: String, required: true },
    namaKategori: { type: String, required: true },
    tipeMenu: { type: String, required: true },
    hargaJual: { type: Number, required: true },
    qty: { type: Number, required: true },
    subtotal: { type: Number, required: true },
    note: { type: String },
    createdAt: { type: Date, required: true },
    updatedAt: { type: Date, required: true },
  },
  { collection: 'order_items', versionKey: false },
);

export function getOrderItemModel(): Model<OrderItemDocument> {
  return model<OrderItemDocument>('OrderItem', orderItemSchema);
}

export interface PaymentDocument extends TimestampDocument {
  orderId: string;
  orderNumber: string;
  method: PaymentMethod;
  amount: number;
  paidAmount: number;
  changeAmount: number;
  cashierId: string;
  paidAt: Date;
}

const paymentSchema = new Schema<PaymentDocument>(
  {
    _id: { type: String, required: true },
    orderId: { type: String, required: true, index: true },
    orderNumber: { type: String, required: true, index: true },
    method: { type: String, required: true, index: true },
    amount: { type: Number, required: true },
    paidAmount: { type: Number, required: true },
    changeAmount: { type: Number, required: true },
    cashierId: { type: String, required: true },
    paidAt: { type: Date, required: true, index: true },
    createdAt: { type: Date, required: true },
    updatedAt: { type: Date, required: true },
  },
  { collection: 'payments', versionKey: false },
);

export function getPaymentModel(): Model<PaymentDocument> {
  return model<PaymentDocument>('Payment', paymentSchema);
}
