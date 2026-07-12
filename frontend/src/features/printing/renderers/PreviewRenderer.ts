import type { Receipt } from '../types/receipt';
import { buildReceiptPreviewLines, type PreviewReceiptLine } from './receiptPreviewLayout';

export interface PreviewReceiptOutput {
  readonly lines: readonly PreviewReceiptLine[];
  readonly paperWidth: '58mm' | '80mm';
}

/**
 * Preview renderer — UI display only.
 * Must never be used as a print source.
 */
export class PreviewRenderer {
  render(receipt: Receipt): PreviewReceiptOutput {
    return {
      lines: buildReceiptPreviewLines(receipt),
      paperWidth: receipt.paperWidth,
    };
  }
}
