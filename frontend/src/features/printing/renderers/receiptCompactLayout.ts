import type { Receipt } from '../types/receipt';
import type { PrinterProfile } from '../profiles/printerProfile';
import {
  formatReceiptDateTimeCompact,
  formatReceiptDiningCompact,
  formatReceiptFooterCompact,
  formatReceiptMoney,
  formatReceiptOrderShort,
} from '../receipt/formatMoney';

export type CompactReceiptLineKind = 'heavy-separator' | 'light-separator' | 'text' | 'row';

export interface CompactReceiptLine {
  readonly kind: CompactReceiptLineKind;
  readonly text?: string;
  readonly left?: string;
  readonly right?: string;
  readonly align?: 'left' | 'center';
  readonly weight?: 'normal' | 'bold';
}

function heavySeparator(width: number): CompactReceiptLine {
  return { kind: 'heavy-separator', text: '='.repeat(width), align: 'center' };
}

function lightSeparator(width: number): CompactReceiptLine {
  return { kind: 'light-separator', text: '-'.repeat(width), align: 'center' };
}

/** Pad a two-column thermal row to fixed width (monospace). */
export function formatThermalRow(left: string, right: string, width: number): string {
  const trimmedRight = right.trim();
  const maxLeft = Math.max(1, width - trimmedRight.length - 1);
  const trimmedLeft = left.length > maxLeft ? left.slice(0, maxLeft) : left;
  return `${trimmedLeft.padEnd(maxLeft)} ${trimmedRight}`;
}

/**
 * Compact 58mm receipt layout — minimal lines, two-column rows.
 * Shared by thermal ESC/POS and on-screen preview.
 */
export function buildCompactReceiptLines(receipt: Receipt, profile: PrinterProfile): CompactReceiptLine[] {
  const width = profile.charsPerLine;
  const lines: CompactReceiptLine[] = [];

  lines.push(heavySeparator(width));
  lines.push({ kind: 'text', text: receipt.businessName, align: 'center', weight: 'bold' });
  lines.push(heavySeparator(width));

  lines.push({
    kind: 'text',
    text: `${formatReceiptOrderShort(receipt.orderNumber)}  ${formatReceiptDateTimeCompact(receipt.transactionDate)}`,
  });
  lines.push({
    kind: 'text',
    text: `${receipt.cashierName} · ${receipt.paymentMethod} · ${formatReceiptDiningCompact(receipt.diningType)}`,
  });
  lines.push(lightSeparator(width));

  for (const item of receipt.items) {
    lines.push({
      kind: 'row',
      left: `${item.qty}x ${item.namaMenu}`,
      right: formatReceiptMoney(item.subtotal),
    });
    if (item.note) {
      lines.push({ kind: 'text', text: `* ${item.note}` });
    }
  }

  lines.push(lightSeparator(width));

  const showSubtotal = receipt.items.length > 1 || receipt.discount > 0;
  if (showSubtotal) {
    lines.push({ kind: 'row', left: 'Subtotal', right: formatReceiptMoney(receipt.subtotal) });
  }
  if (receipt.discount > 0) {
    lines.push({ kind: 'row', left: 'Diskon', right: formatReceiptMoney(receipt.discount) });
  }

  lines.push({ kind: 'row', left: 'TOTAL', right: formatReceiptMoney(receipt.grandTotal), weight: 'bold' });
  lines.push({
    kind: 'row',
    left: `Bayar ${formatReceiptMoney(receipt.paidAmount)}`,
    right: `Kmb ${formatReceiptMoney(receipt.changeAmount)}`,
    weight: 'bold',
  });

  lines.push(lightSeparator(width));
  lines.push({ kind: 'text', text: formatReceiptFooterCompact(receipt.footerMessage), align: 'center' });
  lines.push(heavySeparator(width));

  return lines;
}
