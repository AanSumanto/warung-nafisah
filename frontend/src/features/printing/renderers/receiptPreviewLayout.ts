import type { Receipt } from '../types/receipt';
import { BLUEPRINT_BP_ECO58 } from '../profiles/printerProfile';
import { buildCompactReceiptLines, type CompactReceiptLine } from './receiptCompactLayout';

export type PreviewLineAlign = 'left' | 'center' | 'right';
export type PreviewLineWeight = 'normal' | 'bold';

export interface PreviewReceiptLine {
  readonly text?: string;
  readonly align?: PreviewLineAlign;
  readonly weight?: PreviewLineWeight;
  readonly size?: 'sm' | 'md' | 'lg';
  readonly kind?: 'separator' | 'text' | 'row';
  readonly left?: string;
  readonly right?: string;
}

function toPreviewLine(line: CompactReceiptLine): PreviewReceiptLine {
  if (line.kind === 'heavy-separator' || line.kind === 'light-separator') {
    return { text: line.text, kind: 'separator', align: 'center' };
  }

  if (line.kind === 'row' && line.left && line.right) {
    const isTotal = line.left === 'TOTAL' || line.left.startsWith('Bayar ');
    return {
      kind: 'row',
      left: line.left,
      right: line.right,
      weight: line.weight === 'bold' || isTotal ? 'bold' : 'normal',
      size: line.left === 'TOTAL' ? 'lg' : 'md',
    };
  }

  const isTitle = line.weight === 'bold' && line.align === 'center';
  return {
    kind: 'text',
    text: line.text,
    align: line.align ?? 'left',
    weight: line.weight,
    size: isTitle ? 'lg' : line.text?.startsWith('*') ? 'sm' : 'md',
  };
}

/** UI preview — mirrors compact thermal layout (not used for printing). */
export function buildReceiptPreviewLines(receipt: Receipt): PreviewReceiptLine[] {
  return buildCompactReceiptLines(receipt, BLUEPRINT_BP_ECO58).map(toPreviewLine);
}
