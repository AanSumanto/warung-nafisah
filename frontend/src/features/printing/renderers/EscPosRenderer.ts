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
  alignCenter: () => new Uint8Array([ESC, 0x61, 1]),
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

/**
 * Epson-compatible ESC/POS QR (GS ( k).
 * Module size kept conservative for 58mm paper.
 */
export function buildEscPosQrCommands(payload: string, moduleSize = 4): Uint8Array {
  const data = encodeEscPosText(payload);
  const storeLen = data.length + 3;
  const pL = storeLen & 0xff;
  const pH = (storeLen >> 8) & 0xff;
  const size = Math.min(8, Math.max(3, moduleSize));

  return concatChunks([
    // Select model 2
    new Uint8Array([GS, 0x28, 0x6b, 0x04, 0x00, 0x31, 0x41, 0x32, 0x00]),
    // Module size
    new Uint8Array([GS, 0x28, 0x6b, 0x03, 0x00, 0x31, 0x43, size]),
    // Error correction M
    new Uint8Array([GS, 0x28, 0x6b, 0x03, 0x00, 0x31, 0x45, 0x31]),
    // Store data
    concatChunks([
      new Uint8Array([GS, 0x28, 0x6b, pL, pH, 0x31, 0x50, 0x30]),
      data,
    ]),
    // Print symbol
    new Uint8Array([GS, 0x28, 0x6b, 0x03, 0x00, 0x31, 0x51, 0x30]),
  ]);
}

function pushLine(chunks: Uint8Array[], line: ThermalReceiptLine, profile: PrinterProfile): void {
  const width = profile.charsPerLine;

  if (line.kind === 'qr') {
    if (profile.supportsQr && line.qrPayload) {
      try {
        chunks.push(CMD.alignCenter());
        chunks.push(buildEscPosQrCommands(line.qrPayload, 4));
        chunks.push(CMD.feed(1));
        chunks.push(CMD.alignLeft());
      } catch {
        // QR must never abort receipt — text fallback already on adjacent lines
        chunks.push(CMD.alignCenter());
        chunks.push(textLine('[QR tidak tersedia]'));
        chunks.push(CMD.alignLeft());
      }
    }
    return;
  }

  if (line.kind === 'heavy-separator' || line.kind === 'light-separator') {
    chunks.push(textLine(line.text ?? ''));
    return;
  }

  if (line.kind === 'row' && line.left && line.right) {
    chunks.push(textLine(formatThermalRow(line.left, line.right, width)));
    return;
  }

  if (line.align === 'center') {
    chunks.push(CMD.alignCenter());
  }

  chunks.push(textLine(line.text ?? ''));
  chunks.push(CMD.alignLeft());
}

/**
 * ESC/POS command renderer — thermal output only.
 * Never produces HTML, CSS, or browser print payloads.
 * QR failure never fails the whole receipt.
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
