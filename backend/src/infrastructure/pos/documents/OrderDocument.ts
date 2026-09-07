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
  lineKind?: 'PAID' | 'REWARD';
  rewardCode?: string;
  rewardHppSnapshot?: number;
  pointsUsed?: number;
}

export interface OrderCustomerSnapshotEmbedded {
  customerId: string;
  phoneMasked: string;
  name?: string;
}

export interface OrderLoyaltyReceiptEmbedded {
  awarded: true;
  pointsEarned: number;
  balanceAfter: number;
  eligiblePaidAmount: number;
  programVersion: number;
  pointEarnRate: number;
  ledgerEntryId: string;
  phoneMasked: string;
  name?: string;
  publicMemberId: string;
  progressMessage: string;
  memberPortalUrl?: string;
  nextRewardName?: string;
  nextRewardPointsRemaining?: number;
  redemption?: {
    rewardCode: string;
    rewardName: string;
    menuKode: string;
    pointsUsed: number;
    rewardHppSnapshot: number;
    ledgerEntryId: string;
    balanceAfter: number;
  };
}

export interface OrderLoyaltyRedemptionIntentEmbedded {
  rewardCode: string;
  customerId: string;
  selectedAt: Date;
  selectedBy: string;
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
  /** Optional — historical orders omit these fields. */
  customerId?: string | null;
  customerSnapshot?: OrderCustomerSnapshotEmbedded | null;
  loyaltyReceipt?: OrderLoyaltyReceiptEmbedded | null;
  loyaltyRedemptionIntent?: OrderLoyaltyRedemptionIntentEmbedded | null;
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
    lineKind: { type: String },
    rewardCode: { type: String },
    rewardHppSnapshot: { type: Number },
    pointsUsed: { type: Number },
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
    customerId: { type: String, index: true, sparse: true },
    customerSnapshot: {
      type: {
        customerId: { type: String, required: true },
        phoneMasked: { type: String, required: true },
        name: { type: String },
      },
      required: false,
      _id: false,
    },
    loyaltyReceipt: {
      type: {
        awarded: { type: Boolean, required: true },
        pointsEarned: { type: Number, required: true },
        balanceAfter: { type: Number, required: true },
        eligiblePaidAmount: { type: Number, required: true },
        programVersion: { type: Number, required: true },
        pointEarnRate: { type: Number, required: true },
        ledgerEntryId: { type: String, required: true },
        phoneMasked: { type: String, required: true },
        name: { type: String },
        publicMemberId: { type: String, required: true },
        progressMessage: { type: String, required: true },
        memberPortalUrl: { type: String },
        nextRewardName: { type: String },
        nextRewardPointsRemaining: { type: Number },
        redemption: {
          type: {
            rewardCode: { type: String, required: true },
            rewardName: { type: String, required: true },
            menuKode: { type: String, required: true },
            pointsUsed: { type: Number, required: true },
            rewardHppSnapshot: { type: Number, required: true },
            ledgerEntryId: { type: String, required: true },
            balanceAfter: { type: Number, required: true },
          },
          required: false,
          _id: false,
        },
      },
      required: false,
      _id: false,
    },
    loyaltyRedemptionIntent: {
      type: {
        rewardCode: { type: String, required: true },
        customerId: { type: String, required: true },
        selectedAt: { type: Date, required: true },
        selectedBy: { type: String, required: true },
      },
      required: false,
      _id: false,
    },
    createdAt: { type: Date, required: true },
    updatedAt: { type: Date, required: true },
  },
  { collection: 'orders', versionKey: false },
);

export function getOrderModel(): Model<OrderDocument> {
  return model<OrderDocument>('Order', orderSchema);
}
