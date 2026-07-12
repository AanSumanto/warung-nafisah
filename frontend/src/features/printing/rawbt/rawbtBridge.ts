import {
  base64Preview,
  bytesPreviewHex,
  isActivityNotFoundError,
  RAWBT_MIME_TYPE,
  rawbtLog,
} from './rawbtLogger';
import { RawBtNotInstalledError } from '../types/printer';

export const RAWBT_PACKAGE = 'ru.a402d.rawbtprinter';

export const RAWBT_PLAY_STORE_URL = `https://play.google.com/store/apps/details?id=${RAWBT_PACKAGE}`;

export const RAWBT_RENDERER = 'EscPosRenderer';

export { RAWBT_MIME_TYPE };

export function isAndroidDevice(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /android/i.test(navigator.userAgent);
}

/** Encode ESC/POS bytes to standard base64 (no line breaks). */
export function bytesToBase64(bytes: Uint8Array): string {
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(bytes).toString('base64');
  }

  let binary = '';
  const chunkSize = 0x8000;
  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    const chunk = bytes.subarray(offset, offset + chunkSize);
    binary += String.fromCharCode(...chunk);
  }
  return btoa(binary);
}

/**
 * Official RawBT intent for binary ESC/POS (Mike42 RawbtPrintConnector).
 * Payload before #Intent is `base64,<data>` — NOT `rawbt:base64,<data>`.
 * Base64 must be raw (no URL encoding); RawBT decodes it directly.
 *
 * @see https://github.com/mike42/escpos-php/blob/development/src/Mike42/Escpos/PrintConnectors/RawbtPrintConnector.php
 */
export function buildRawBtIntentUrl(base64Data: string): string {
  return `intent:base64,${base64Data}#Intent;scheme=rawbt;package=${RAWBT_PACKAGE};end;`;
}

/**
 * RawBT URI scheme for binary ESC/POS.
 * @see https://github.com/402d/DemoRawBtPrinter — test2/test16
 */
export function buildRawBtSchemeUrl(base64Data: string): string {
  return `rawbt:base64,${base64Data}`;
}

export interface RawBtDispatchContext {
  readonly renderer?: string;
  readonly mimeType?: string;
  readonly orderNumber?: string;
  readonly receiptSummary?: Record<string, unknown>;
}

function assertEscPosPayload(bytes: Uint8Array): void {
  if (bytes.length === 0) {
    throw new Error('Payload ESC/POS kosong');
  }

  if (bytes[0] !== 0x1b || bytes[1] !== 0x40) {
    rawbtLog.error('payload:invalid-escpos-header', {
      payloadPreviewHex: bytesPreviewHex(bytes),
      payloadLength: bytes.length,
    });
    throw new Error('Payload bukan ESC/POS valid (harus diawali ESC @)');
  }
}

/** Open a RawBT URI without navigating the SPA away from the current page. */
export function openRawBtUri(uri: string): void {
  const link = document.createElement('a');
  link.href = uri;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  link.remove();
}

/**
 * Dispatch ESC/POS bytes to RawBT.
 * Uses `rawbt:base64,<data>` — the official binary channel (DemoRawBtPrinter test2).
 * Intent URI is logged for audit only; URL-encoding base64 corrupts RawBT decode (WRC error).
 */
export function dispatchRawBtPrint(bytes: Uint8Array, context: RawBtDispatchContext = {}): void {
  if (typeof window === 'undefined') {
    throw new Error('RawBT dispatch hanya tersedia di browser');
  }

  assertEscPosPayload(bytes);

  const base64Data = bytesToBase64(bytes);
  const schemeUri = buildRawBtSchemeUrl(base64Data);
  const intentUri = buildRawBtIntentUrl(base64Data);

  rawbtLog.info('dispatch:prepare', {
    renderer: context.renderer ?? RAWBT_RENDERER,
    mimeType: context.mimeType ?? RAWBT_MIME_TYPE,
    orderNumber: context.orderNumber,
    receiptSummary: context.receiptSummary,
    payloadLength: bytes.length,
    payloadBase64Length: base64Data.length,
    payloadPreview: base64Preview(base64Data),
    payloadPreviewHex: bytesPreviewHex(bytes),
    schemeUri,
    intentUri,
  });

  try {
    rawbtLog.info('dispatch:attempt', { method: 'scheme', mimeType: RAWBT_MIME_TYPE, schemeUri });
    openRawBtUri(schemeUri);
    rawbtLog.info('dispatch:callback', { method: 'scheme', status: 'dispatched' });
  } catch (error) {
    rawbtLog.error('dispatch:error', {
      method: 'scheme',
      error: error instanceof Error ? error.message : String(error),
      schemeUri,
    });

    if (isActivityNotFoundError(error)) {
      throw new RawBtNotInstalledError();
    }

    throw error;
  }
}
