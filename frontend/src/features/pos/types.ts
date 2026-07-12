import type { MENU_CATEGORY_CODES } from './constants';

export type MenuCategoryCode = (typeof MENU_CATEGORY_CODES)[number];
export type MenuType = 'ITEM' | 'BUNDLE';
export type MenuStatus = 'available' | 'sold_out' | 'hidden';
export type OrderStatus = 'draft' | 'paid' | 'cancelled';
export type DiningType = 'dine_in' | 'take_away';
export type PaymentMethod = 'cash' | 'qris' | 'transfer';
export type ShiftStatus = 'open' | 'closed';

export interface BundleComponent {
  readonly kodeMenu: string;
  readonly qty: number;
}

export interface Menu {
  readonly id: string;
  readonly kodeMenu: string;
  readonly namaMenu: string;
  readonly tipeMenu: MenuType;
  readonly kodeKategori: MenuCategoryCode;
  readonly namaKategori: string;
  readonly hargaJual: number;
  readonly status: MenuStatus;
  readonly sellingTime?: string;
  readonly bundleItems?: readonly BundleComponent[];
}

export interface OrderItem {
  readonly id: string;
  readonly kodeMenu: string;
  readonly namaMenu: string;
  readonly kodeKategori: string;
  readonly namaKategori: string;
  readonly tipeMenu: MenuType;
  readonly hargaJual: number;
  readonly qty: number;
  readonly subtotal: number;
  readonly note?: string;
}

export interface Order {
  readonly id: string;
  readonly orderNumber: string;
  readonly status: OrderStatus;
  readonly diningType: DiningType;
  readonly cashierId: string;
  readonly cashierName: string;
  readonly shiftId?: string;
  readonly items: OrderItem[];
  readonly total: number;
  readonly paymentMethod?: PaymentMethod;
  readonly paidAmount?: number;
  readonly changeAmount?: number;
  readonly paidAt?: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface ShiftOpen {
  readonly id: string;
  readonly status: 'open';
  readonly openingCash: number;
  readonly openedAt: string;
}

export interface ShiftClosed {
  readonly id: string;
  readonly status: 'closed';
  readonly openingCash: number;
  readonly closingCash?: number;
  readonly openedAt: string;
  readonly closedAt?: string;
}

export type ShiftCurrent = ShiftOpen | null;

export interface DashboardStats {
  readonly transactionCount: number;
  readonly revenue: number;
  readonly paymentBreakdown: {
    readonly cash: number;
    readonly qris: number;
    readonly transfer: number;
  };
}

export interface CartLine {
  readonly kodeMenu: string;
  readonly namaMenu: string;
  readonly hargaJual: number;
  readonly qty: number;
  readonly note?: string;
}

export interface OrderItemInput {
  readonly kodeMenu: string;
  readonly qty: number;
  readonly note?: string;
}

export interface CreateOrderRequest {
  readonly diningType: DiningType;
}

export interface UpdateOrderItemsRequest {
  readonly items: OrderItemInput[];
}

export interface PayOrderRequest {
  readonly paymentMethod: PaymentMethod;
  readonly paidAmount?: number;
}

export interface OpenShiftRequest {
  readonly openingCash: number;
}

export interface CloseShiftRequest {
  readonly closingCash: number;
}
