import type { Receipt } from '../types/receipt';
import { buildReceiptLines } from './receiptLayout';

const ESC = 0x1b;
const GS = 0x1d;
const LF = 0x0a;

const CMD = {
  init: () => new Uint8Array([ESC, 0x40]),
  alignCenter: () => new Uint8Array([ESC, 0x61, 1]),
  alignLeft: () => new Uint8Array([ESC, 0x61, 0]),
  boldOn: () => new Uint8Array([ESC, 0x45, 1]),
  boldOff: () => new Uint8Array([ESC, 0x45, 0]),
  feed: (lines = 1) => new Uint8Array(Array(lines).fill(LF)),
  cut: () => new Uint8Array([GS, 0x56, 0]),
};

function concatChunks(chunks: Uint8Array[]): Uint8Array {
  const total = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const result = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }
  return result;
}

function textLine(text: string): Uint8Array {
  const encoder = new TextEncoder();
  return encoder.encode(`${text}${'\n'}`);
}

/**
 * ESC/POS command renderer — same Receipt Object as HTML renderer.
 */
export class EscPosRenderer {
  render(receipt: Receipt): Uint8Array {
    const chunks: Uint8Array[] = [CMD.init()];
    const lines = buildReceiptLines(receipt);

    for (const line of lines) {
      if (line.kind === 'separator') {
        chunks.push(CMD.alignCenter(), textLine(line.text));
        chunks.push(CMD.alignLeft());
        continue;
      }

      if (line.align === 'center') {
        chunks.push(CMD.alignCenter());
      } else {
        chunks.push(CMD.alignLeft());
      }

      if (line.weight === 'bold') {
        chunks.push(CMD.boldOn());
      }

      const content =
        line.kind === 'row' && line.left && line.right
          ? `${line.left} ${line.right}`
          : line.text;
      chunks.push(textLine(content));

      if (line.weight === 'bold') {
        chunks.push(CMD.boldOff());
      }

      chunks.push(CMD.alignLeft());
    }

    chunks.push(CMD.feed(3), CMD.cut());
    return concatChunks(chunks);
  }
}
