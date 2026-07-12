import type { Receipt } from '../types/receipt';
import { formatReceiptDate, formatReceiptMoney } from '../receipt/formatMoney';

export type ReceiptLineAlign = 'left' | 'center' | 'right';
export type ReceiptLineWeight = 'normal' | 'bold';

export interface ReceiptLine {
  readonly text: string;
  readonly align?: ReceiptLineAlign;
  readonly weight?: ReceiptLineWeight;
  readonly size?: 'sm' | 'md' | 'lg';
  readonly kind?: 'separator' | 'text' | 'row' | 'field';
  readonly left?: string;
  readonly right?: string;
}

const SEPARATOR = '----------------------------------------';

function fieldLine(label: string, value: string): ReceiptLine {
  return {
    text: `${label} : ${value}`,
    kind: 'field',
    align: 'left',
  };
}

export function buildReceiptLines(receipt: Receipt): ReceiptLine[] {
  const lines: ReceiptLine[] = [];

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

  lines.push({ text: SEPARATOR, kind: 'separator', align: 'center' });
  lines.push(fieldLine('No', receipt.orderNumber));
  lines.push(fieldLine('Tanggal', formatReceiptDate(receipt.transactionDate)));
  lines.push(fieldLine('Kasir', receipt.cashierName));
  lines.push(fieldLine('Pembayaran', receipt.paymentMethod));
  lines.push(fieldLine('Pesanan', receipt.diningType));
  lines.push({ text: SEPARATOR, kind: 'separator', align: 'center' });

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

  lines.push({ text: SEPARATOR, kind: 'separator', align: 'center' });
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
  lines.push({ text: SEPARATOR, kind: 'separator', align: 'center' });

  for (const line of receipt.footerMessage.split('\n')) {
    lines.push({ text: line, align: 'center', size: 'sm' });
  }

  return lines;
}
