export type PaperWidth = '58mm' | '80mm';

export interface ReceiptItem {
  readonly kodeMenu: string;
  readonly namaMenu: string;
  readonly qty: number;
  readonly hargaJual: number;
  readonly subtotal: number;
  readonly note?: string;
  readonly lineKind?: 'PAID' | 'REWARD';
}

/** Authoritative loyalty snapshot for receipts — never recalculate points here. */
export interface ReceiptLoyalty {
  readonly phoneMasked: string;
  readonly memberName?: string;
  readonly pointsEarned: number;
  readonly balanceAfter: number;
  readonly progressMessage: string;
  /** Portal URL for QR — only when backend QR gate enabled. */
  readonly memberPortalUrl?: string;
  readonly redemption?: {
    readonly rewardName: string;
    readonly pointsUsed: number;
  };
}

/** Single source of truth for all receipt renderers. */
export interface Receipt {
  readonly businessName: string;
  readonly logo: string | null;
  readonly address: string | null;
  readonly phone: string | null;
  readonly orderNumber: string;
  readonly transactionDate: string;
  readonly cashierName: string;
  readonly paymentMethod: string;
  readonly diningType: string;
  readonly items: readonly ReceiptItem[];
  readonly subtotal: number;
  readonly discount: number;
  readonly tax: number;
  readonly grandTotal: number;
  readonly paidAmount: number;
  readonly changeAmount: number;
  readonly footerMessage: string;
  readonly paperWidth: PaperWidth;
  /** Present only for awarded member sales. */
  readonly loyalty?: ReceiptLoyalty;
}

export interface ReceiptBusinessConfig {
  readonly businessName: string;
  readonly logo?: string | null;
  readonly address?: string | null;
  readonly phone?: string | null;
  readonly footerMessage?: string;
  readonly paperWidth?: PaperWidth;
}
