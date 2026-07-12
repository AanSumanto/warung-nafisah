import type { Receipt } from '../types/receipt';
import type { PrinterProfile } from '../profiles/printerProfile';
import { formatReceiptDateThermal, formatReceiptMoney } from '../receipt/formatMoney';

export type ThermalLineKind =
  | 'heavy-separator'
  | 'light-separator'
  | 'text'
  | 'field-block'
  | 'item-name'
  | 'item-qty'
  | 'item-subtotal'
  | 'amount-block';

export interface ThermalReceiptLine {
  readonly kind: ThermalLineKind;
  readonly text?: string;
  readonly label?: string;
  readonly value?: string;
  readonly align?: 'left' | 'center';
  readonly weight?: 'normal' | 'bold';
}

function heavySeparator(width: number): ThermalReceiptLine {
  return { kind: 'heavy-separator', text: '='.repeat(width), align: 'center' };
}

function lightSeparator(width: number): ThermalReceiptLine {
  return { kind: 'light-separator', text: '-'.repeat(width), align: 'center' };
}

function fieldBlock(label: string, value: string): ThermalReceiptLine {
  return { kind: 'field-block', label, value, align: 'left' };
}

function amountBlock(label: string, value: string, weight: 'normal' | 'bold' = 'normal'): ThermalReceiptLine {
  return { kind: 'amount-block', label, value, align: 'left', weight };
}

/** Thermal-optimized line model — used only by ESC/POS renderer. */
export function buildReceiptThermalLines(receipt: Receipt, profile: PrinterProfile): ThermalReceiptLine[] {
  const width = profile.charsPerLine;
  const lines: ThermalReceiptLine[] = [];

  lines.push(heavySeparator(width));
  lines.push({ kind: 'text', text: receipt.businessName, align: 'center', weight: 'bold' });

  if (receipt.address) {
    lines.push({ kind: 'text', text: receipt.address, align: 'center' });
  }
  if (receipt.phone) {
    lines.push({ kind: 'text', text: receipt.phone, align: 'center' });
  }

  lines.push(heavySeparator(width));
  lines.push(fieldBlock('No', receipt.orderNumber));
  lines.push(fieldBlock('Tanggal', formatReceiptDateThermal(receipt.transactionDate)));
  lines.push(fieldBlock('Kasir', receipt.cashierName));
  lines.push(fieldBlock('Pembayaran', receipt.paymentMethod));
  lines.push(fieldBlock('Pesanan', receipt.diningType));
  lines.push(lightSeparator(width));

  for (const item of receipt.items) {
    lines.push({ kind: 'item-name', text: item.namaMenu, align: 'left', weight: 'bold' });
    lines.push({
      kind: 'item-qty',
      text: `${item.qty} x ${formatReceiptMoney(item.hargaJual)}`,
      align: 'left',
    });
    lines.push({
      kind: 'item-subtotal',
      text: formatReceiptMoney(item.subtotal),
      align: 'left',
      weight: 'bold',
    });
    if (item.note) {
      lines.push({ kind: 'text', text: `* ${item.note}`, align: 'left' });
    }
  }

  lines.push(lightSeparator(width));
  lines.push(amountBlock('Subtotal', formatReceiptMoney(receipt.subtotal)));
  lines.push(amountBlock('Diskon', formatReceiptMoney(receipt.discount)));
  lines.push(amountBlock('Total', formatReceiptMoney(receipt.grandTotal), 'bold'));
  lines.push(amountBlock(receipt.paymentMethod, formatReceiptMoney(receipt.paidAmount)));
  lines.push(amountBlock('Kembali', formatReceiptMoney(receipt.changeAmount), 'bold'));
  lines.push(lightSeparator(width));

  for (const footerLine of receipt.footerMessage.split('\n')) {
    lines.push({ kind: 'text', text: footerLine, align: 'center' });
  }

  lines.push(heavySeparator(width));

  return lines;
}

/** Pad a two-column thermal row to fixed width (monospace). */
export function formatThermalRow(left: string, right: string, width: number): string {
  const trimmedRight = right.trim();
  const maxLeft = Math.max(1, width - trimmedRight.length - 1);
  const trimmedLeft = left.length > maxLeft ? left.slice(0, maxLeft) : left;
  return `${trimmedLeft.padEnd(maxLeft)} ${trimmedRight}`;
}
