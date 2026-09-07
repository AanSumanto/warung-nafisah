import type { Receipt } from '../types/receipt';
import type { PrinterProfile } from '../profiles/printerProfile';
import {
  formatReceiptDateTimeCompact,
  formatReceiptDiningCompact,
  formatReceiptFooterCompact,
  formatReceiptMoney,
  formatReceiptOrderShort,
} from '../receipt/formatMoney';

export type CompactReceiptLineKind =
  | 'heavy-separator'
  | 'light-separator'
  | 'text'
  | 'row'
  | 'qr';

export interface CompactReceiptLine {
  readonly kind: CompactReceiptLineKind;
  readonly text?: string;
  readonly left?: string;
  readonly right?: string;
  readonly align?: 'left' | 'center';
  readonly weight?: 'normal' | 'bold';
  /** Portal URL for native ESC/POS QR — never logged as full token at info. */
  readonly qrPayload?: string;
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
    const name =
      item.lineKind === 'REWARD' ? `${item.namaMenu} (Reward)` : item.namaMenu;
    lines.push({
      kind: 'row',
      left: `${item.qty}x ${name}`,
      right: formatReceiptMoney(item.subtotal),
    });
    if (item.note && item.lineKind !== 'REWARD') {
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

  if (receipt.loyalty) {
    lines.push(lightSeparator(width));
    lines.push({ kind: 'text', text: 'NAFISAH REWARDS', align: 'center', weight: 'bold' });
    const memberLabel = receipt.loyalty.memberName
      ? `${truncate(receipt.loyalty.memberName, 14)} — ${receipt.loyalty.phoneMasked}`
      : receipt.loyalty.phoneMasked;
    lines.push({ kind: 'text', text: `Member: ${memberLabel}` });
    if (receipt.loyalty.redemption) {
      lines.push({
        kind: 'text',
        text: `Reward: ${truncate(receipt.loyalty.redemption.rewardName, 22)}`,
      });
      lines.push({
        kind: 'row',
        left: 'Poin digunakan',
        right: `-${receipt.loyalty.redemption.pointsUsed}`,
      });
    }
    lines.push({
      kind: 'row',
      left: 'Poin transaksi',
      right: `+${receipt.loyalty.pointsEarned}`,
    });
    lines.push({
      kind: 'row',
      left: 'Total poin',
      right: String(receipt.loyalty.balanceAfter),
    });
    for (const part of wrapText(receipt.loyalty.progressMessage, width)) {
      lines.push({ kind: 'text', text: part });
    }

    if (receipt.loyalty.memberPortalUrl) {
      lines.push({ kind: 'qr', qrPayload: receipt.loyalty.memberPortalUrl });
      lines.push({ kind: 'text', text: 'Scan untuk cek poin & reward', align: 'center' });
    } else {
      lines.push({ kind: 'text', text: 'Cek poin di Nafisah Rewards', align: 'center' });
    }
  }

  lines.push(lightSeparator(width));
  lines.push({ kind: 'text', text: formatReceiptFooterCompact(receipt.footerMessage), align: 'center' });
  lines.push(heavySeparator(width));

  return lines;
}

function truncate(value: string, max: number): string {
  const trimmed = value.trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, Math.max(1, max - 1))}…`;
}

function wrapText(value: string, width: number): string[] {
  const text = value.trim();
  if (!text) return [];
  if (text.length <= width) return [text];
  const parts: string[] = [];
  let remaining = text;
  while (remaining.length > width) {
    let breakAt = remaining.lastIndexOf(' ', width);
    if (breakAt < Math.floor(width / 2)) breakAt = width;
    parts.push(remaining.slice(0, breakAt).trimEnd());
    remaining = remaining.slice(breakAt).trimStart();
  }
  if (remaining) parts.push(remaining);
  return parts;
}
