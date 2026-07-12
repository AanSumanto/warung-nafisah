import type { Order } from '@/features/pos/types';
import { DINING_TYPE_LABELS, PAYMENT_METHOD_LABELS } from '@/features/pos/constants';
import type { Receipt, ReceiptBusinessConfig } from '../types/receipt';

export interface OrderLike {
  readonly orderNumber: string;
  readonly cashierName: string;
  readonly diningType: Order['diningType'];
  readonly paymentMethod?: Order['paymentMethod'];
  readonly paidAt?: string;
  readonly createdAt: string;
  readonly total: number;
  readonly paidAmount?: number;
  readonly changeAmount?: number;
  readonly items: ReadonlyArray<{
    readonly kodeMenu: string;
    readonly namaMenu: string;
    readonly qty: number;
    readonly hargaJual: number;
    readonly subtotal: number;
    readonly note?: string;
  }>;
}

const DEFAULT_CONFIG: Required<ReceiptBusinessConfig> = {
  businessName: 'WARUNG NAFISAH',
  logo: null,
  address: null,
  phone: null,
  footerMessage: 'Terima kasih.\nSelamat menikmati.',
  paperWidth: '58mm',
};

/**
 * Builds Receipt Object from Order aggregate snapshot.
 * No knowledge of HTML, Bluetooth, ESC/POS, or printers.
 */
export class ReceiptBuilder {
  static build(order: OrderLike, config: Partial<ReceiptBusinessConfig> = {}): Receipt {
    const merged = { ...DEFAULT_CONFIG, ...config };
    const grandTotal = order.total;
    const paidAmount = order.paidAmount ?? grandTotal;
    const changeAmount = order.changeAmount ?? Math.max(0, paidAmount - grandTotal);

    return {
      businessName: merged.businessName,
      logo: merged.logo ?? null,
      address: merged.address ?? null,
      phone: merged.phone ?? null,
      orderNumber: order.orderNumber,
      transactionDate: order.paidAt ?? order.createdAt,
      cashierName: order.cashierName,
      paymentMethod: order.paymentMethod
        ? PAYMENT_METHOD_LABELS[order.paymentMethod]
        : '-',
      diningType: DINING_TYPE_LABELS[order.diningType],
      items: order.items.map((item) => ({
        kodeMenu: item.kodeMenu,
        namaMenu: item.namaMenu,
        qty: item.qty,
        hargaJual: item.hargaJual,
        subtotal: item.subtotal,
        note: item.note,
      })),
      subtotal: grandTotal,
      discount: 0,
      tax: 0,
      grandTotal,
      paidAmount,
      changeAmount,
      footerMessage: merged.footerMessage,
      paperWidth: merged.paperWidth,
    };
  }
}
