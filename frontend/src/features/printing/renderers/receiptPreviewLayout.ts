import type { Receipt } from '../types/receipt';
import { formatReceiptDate, formatReceiptMoney } from '../receipt/formatMoney';

export type PreviewLineAlign = 'left' | 'center' | 'right';
export type PreviewLineWeight = 'normal' | 'bold';

export interface PreviewReceiptLine {
  readonly text?: string;
  readonly align?: PreviewLineAlign;
  readonly weight?: PreviewLineWeight;
  readonly size?: 'sm' | 'md' | 'lg';
  readonly kind?: 'separator' | 'text' | 'row' | 'field-block';
  readonly label?: string;
  readonly value?: string;
  readonly left?: string;
  readonly right?: string;
}

const LIGHT_SEPARATOR = '--------------------------------';

function fieldBlock(label: string, value: string): PreviewReceiptLine {
  return { kind: 'field-block', label, value, align: 'left' };
}

/** UI preview layout — modern responsive display, not used for printing. */
export function buildReceiptPreviewLines(receipt: Receipt): PreviewReceiptLine[] {
  const lines: PreviewReceiptLine[] = [];

  if (receipt.logo) {
    lines.push({ text: receipt.logo, align: 'center', kind: 'text' });
  }

  lines.push({ text: receipt.businessName, align: 'center', weight: 'bold', size: 'lg' });

  if (receipt.address) {
    lines.push({ text: receipt.address, align: 'center', size: 'sm' });
  }
  if (receipt.phone) {
    lines.push({ text: receipt.phone, align: 'center', size: 'sm' });
  }

  lines.push({ text: LIGHT_SEPARATOR, kind: 'separator', align: 'center' });
  lines.push(fieldBlock('No', receipt.orderNumber));
  lines.push(fieldBlock('Tanggal', formatReceiptDate(receipt.transactionDate)));
  lines.push(fieldBlock('Kasir', receipt.cashierName));
  lines.push(fieldBlock('Pembayaran', receipt.paymentMethod));
  lines.push(fieldBlock('Pesanan', receipt.diningType));
  lines.push({ text: LIGHT_SEPARATOR, kind: 'separator', align: 'center' });

  for (const item of receipt.items) {
    lines.push({ text: item.namaMenu, align: 'left', weight: 'bold' });
    lines.push({
      text: `${item.qty} x ${formatReceiptMoney(item.hargaJual)}`,
      left: `${item.qty} x ${formatReceiptMoney(item.hargaJual)}`,
      right: formatReceiptMoney(item.subtotal),
      kind: 'row',
    });
    if (item.note) {
      lines.push({ text: `* ${item.note}`, align: 'left', size: 'sm' });
    }
  }

  lines.push({ text: LIGHT_SEPARATOR, kind: 'separator', align: 'center' });
  lines.push({
    text: 'Subtotal',
    left: 'Subtotal',
    right: formatReceiptMoney(receipt.subtotal),
    kind: 'row',
  });
  lines.push({
    text: 'Diskon',
    left: 'Diskon',
    right: formatReceiptMoney(receipt.discount),
    kind: 'row',
  });
  lines.push({
    text: 'Total',
    left: 'Total',
    right: formatReceiptMoney(receipt.grandTotal),
    kind: 'row',
    weight: 'bold',
    size: 'lg',
  });
  lines.push({
    text: receipt.paymentMethod,
    left: receipt.paymentMethod,
    right: formatReceiptMoney(receipt.paidAmount),
    kind: 'row',
  });
  lines.push({
    text: 'Kembali',
    left: 'Kembali',
    right: formatReceiptMoney(receipt.changeAmount),
    kind: 'row',
    weight: 'bold',
    size: 'lg',
  });
  lines.push({ text: LIGHT_SEPARATOR, kind: 'separator', align: 'center' });

  for (const line of receipt.footerMessage.split('\n')) {
    lines.push({ text: line, align: 'center', size: 'sm' });
  }

  return lines;
}
