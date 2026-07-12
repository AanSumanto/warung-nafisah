import type { Receipt } from '../types/receipt';
import { buildReceiptLines } from './receiptLayout';

export interface HtmlReceiptOutput {
  readonly html: string;
  readonly printStyles: string;
  readonly paperWidth: string;
}

/**
 * HTML renderer — preview and browser print only.
 * Uses Receipt Object, not Order.
 */
export class HtmlReceiptRenderer {
  render(receipt: Receipt): HtmlReceiptOutput {
    const paperWidth = receipt.paperWidth;
    const fontSize = paperWidth === '80mm' ? '12px' : '11px';
    const lines = buildReceiptLines(receipt);

    const body = lines
      .map((line) => {
        if (line.kind === 'separator') {
          return `<div class="wn-sep">${line.text}</div>`;
        }
        if (line.kind === 'field') {
          return `<div class="wn-line wn-left">${escapeHtml(line.text)}</div>`;
        }
        if (line.kind === 'row' && line.left && line.right) {
          const weight = line.weight === 'bold' ? 'wn-bold' : '';
          const size = line.size === 'lg' ? 'wn-lg' : line.size === 'sm' ? 'wn-sm' : '';
          return `<div class="wn-row ${weight} ${size}"><span>${escapeHtml(line.left)}</span><span>${escapeHtml(line.right)}</span></div>`;
        }
        const align = line.align ?? 'left';
        const weight = line.weight === 'bold' ? 'wn-bold' : '';
        const size = line.size === 'lg' ? 'wn-lg' : line.size === 'sm' ? 'wn-sm' : '';
        return `<div class="wn-line wn-${align} ${weight} ${size}">${escapeHtml(line.text)}</div>`;
      })
      .join('');

    const printStyles = `
      @media print {
        body * { visibility: hidden; }
        #wn-receipt-print-root, #wn-receipt-print-root * { visibility: visible; }
        #wn-receipt-print-root { position: absolute; left: 0; top: 0; width: ${paperWidth}; }
        @page { size: ${paperWidth} auto; margin: 2mm; }
      }
      @media screen {
        #wn-receipt-print-root { position: fixed; left: -9999px; top: 0; }
      }
      #wn-receipt-print-root {
        width: ${paperWidth};
        font-family: 'Courier New', Courier, monospace;
        font-size: ${fontSize};
        color: #000;
        background: #fff;
        padding: 4px 0;
        line-height: 1.35;
      }
      .wn-line { margin: 2px 0; }
      .wn-center { text-align: center; }
      .wn-left { text-align: left; }
      .wn-right { text-align: right; }
      .wn-row { display: flex; justify-content: space-between; gap: 8px; margin: 2px 0; }
      .wn-sep { text-align: center; margin: 4px 0; font-size: 10px; overflow: hidden; }
      .wn-bold { font-weight: 700; }
      .wn-lg { font-size: 1.15em; }
      .wn-sm { font-size: 0.9em; }
    `;

    return {
      html: `<div id="wn-receipt-print-root">${body}</div>`,
      printStyles,
      paperWidth,
    };
  }
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
