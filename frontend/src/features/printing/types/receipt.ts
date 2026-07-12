export type PaperWidth = '58mm' | '80mm';

export interface ReceiptItem {
  readonly kodeMenu: string;
  readonly namaMenu: string;
  readonly qty: number;
  readonly hargaJual: number;
  readonly subtotal: number;
  readonly note?: string;
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
}

export interface ReceiptBusinessConfig {
  readonly businessName: string;
  readonly logo?: string | null;
  readonly address?: string | null;
  readonly phone?: string | null;
  readonly footerMessage?: string;
  readonly paperWidth?: PaperWidth;
}
