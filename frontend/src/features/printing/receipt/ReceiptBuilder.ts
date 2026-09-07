import type { Order } from '@/features/pos/types';
import { DINING_TYPE_LABELS, PAYMENT_METHOD_LABELS } from '@/features/pos/constants';
import type { LoyaltyPayResult } from '@/features/pos/loyaltyTypes';
import type { Receipt, ReceiptBusinessConfig, ReceiptLoyalty } from '../types/receipt';

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
    readonly lineKind?: 'PAID' | 'REWARD';
  }>;
  readonly loyalty?: LoyaltyPayResult;
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
 * Map authoritative backend loyalty into receipt section.
 * Only awarded=true produces loyalty content (disabled/blocked omitted).
 */
export function mapLoyaltyForReceipt(loyalty?: LoyaltyPayResult): ReceiptLoyalty | undefined {
  if (!loyalty?.awarded) return undefined;
  if (typeof loyalty.pointsEarned !== 'number' || typeof loyalty.balanceAfter !== 'number') {
    return undefined;
  }
  if (!loyalty.phoneMasked?.trim()) return undefined;

  return {
    phoneMasked: loyalty.phoneMasked.trim(),
    memberName: loyalty.name?.trim() || undefined,
    pointsEarned: loyalty.pointsEarned,
    balanceAfter: loyalty.balanceAfter,
    progressMessage:
      loyalty.receiptProgress?.progressMessage?.trim() ||
      'Kumpulkan poin untuk tukar reward',
    memberPortalUrl: loyalty.memberPortalUrl?.trim() || undefined,
    redemption: loyalty.redemption
      ? {
          rewardName: loyalty.redemption.rewardName,
          pointsUsed: loyalty.redemption.pointsUsed,
        }
      : undefined,
  };
}

/**
 * Builds Receipt Object from Order aggregate snapshot.
 * No knowledge of HTML, Bluetooth, ESC/POS, or printers.
 * Never calculates points from order.total.
 */
export class ReceiptBuilder {
  static build(order: OrderLike, config: Partial<ReceiptBusinessConfig> = {}): Receipt {
    const merged = { ...DEFAULT_CONFIG, ...config };
    const grandTotal = order.total;
    const paidAmount = order.paidAmount ?? grandTotal;
    const changeAmount = order.changeAmount ?? Math.max(0, paidAmount - grandTotal);
    const loyalty = mapLoyaltyForReceipt(order.loyalty);

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
        lineKind: item.lineKind ?? 'PAID',
      })),
      subtotal: grandTotal,
      discount: 0,
      tax: 0,
      grandTotal,
      paidAmount,
      changeAmount,
      footerMessage: merged.footerMessage,
      paperWidth: merged.paperWidth,
      ...(loyalty ? { loyalty } : {}),
    };
  }
}
