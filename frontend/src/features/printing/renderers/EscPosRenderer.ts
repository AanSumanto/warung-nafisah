import type { Receipt } from '../types/receipt';
import type { PrinterProfile } from '../profiles/printerProfile';
import { BLUEPRINT_BP_ECO58 } from '../profiles/printerProfile';
import {
  buildReceiptThermalLines,
  formatThermalRow,
  type ThermalReceiptLine,
} from './receiptThermalLayout';

const ESC = 0x1b;
const GS = 0x1d;
const LF = 0x0a;

const CMD = {
  init: () => new Uint8Array([ESC, 0x40]),
  alignLeft: () => new Uint8Array([ESC, 0x61, 0]),
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

function encodeEscPosText(text: string): Uint8Array {
  const bytes = new Uint8Array(text.length);
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    bytes[i] = code <= 0xff ? code : 0x3f;
  }
  return bytes;
}

function textLine(text: string): Uint8Array {
  const line = encodeEscPosText(text);
  const withLf = new Uint8Array(line.length + 1);
  withLf.set(line);
  withLf[line.length] = LF;
  return withLf;
}

function pushLine(chunks: Uint8Array[], line: ThermalReceiptLine, profile: PrinterProfile): void {
  const width = profile.charsPerLine;

  if (line.kind === 'heavy-separator' || line.kind === 'light-separator') {
    chunks.push(textLine(line.text ?? ''));
    return;
  }

  if (line.kind === 'field-block' && line.label && line.value) {
    chunks.push(textLine(line.label));
    chunks.push(textLine(line.value));
    return;
  }

  if (line.kind === 'amount-block' && line.label && line.value) {
    chunks.push(textLine(line.label));
    chunks.push(textLine(line.value));
    return;
  }

  let content = line.text ?? '';
  if (line.kind === 'item-subtotal') {
    content = formatThermalRow('', line.text ?? '', width).trim();
  }

  chunks.push(textLine(content));
}

/**
 * ESC/POS command renderer — thermal output only.
 * Never produces HTML, CSS, or browser print payloads.
 */
export class EscPosRenderer {
  constructor(private readonly profile: PrinterProfile = BLUEPRINT_BP_ECO58) {}

  getProfile(): PrinterProfile {
    return this.profile;
  }

  render(receipt: Receipt): Uint8Array {
    const chunks: Uint8Array[] = [CMD.init(), CMD.alignLeft()];
    const lines = buildReceiptThermalLines(receipt, this.profile);

    for (const line of lines) {
      pushLine(chunks, line, this.profile);
    }

    chunks.push(CMD.feed(3));

    if (this.profile.supportsCut) {
      chunks.push(CMD.cut());
    }

    return concatChunks(chunks);
  }
}
