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

function verifyBase64RoundTrip(bytes: Uint8Array, base64Data: string): boolean {
  try {
    if (typeof Buffer !== 'undefined') {
      const decoded = Buffer.from(base64Data, 'base64');
      return decoded.length === bytes.length && decoded.every((value, index) => value === bytes[index]);
    }

    const binary = atob(base64Data);
    if (binary.length !== bytes.length) return false;
    for (let i = 0; i < bytes.length; i++) {
      if (binary.charCodeAt(i) !== bytes[i]) return false;
    }
    return true;
  } catch {
    return false;
  }
}

/**
 * Dispatch via Mike42 intent URL.
 * Must run synchronously inside a user gesture (print button click) — do not await before calling.
 */
export function navigateRawBtIntent(intentUri: string): void {
  window.location.href = intentUri;
}

/**
 * Dispatch ESC/POS bytes to RawBT.
 * Uses official `intent:base64,<data>#Intent;scheme=rawbt;...` (Mike42 / node-escpos RawBT adapter).
 */
export function dispatchRawBtPrint(bytes: Uint8Array, context: RawBtDispatchContext = {}): void {
  if (typeof window === 'undefined') {
    throw new Error('RawBT dispatch hanya tersedia di browser');
  }

  assertEscPosPayload(bytes);

  const base64Data = bytesToBase64(bytes);
  const intentUri = buildRawBtIntentUrl(base64Data);
  const schemeUri = buildRawBtSchemeUrl(base64Data);
  const roundTripOk = verifyBase64RoundTrip(bytes, base64Data);

  rawbtLog.info('dispatch:prepare', {
    renderer: context.renderer ?? RAWBT_RENDERER,
    mimeType: context.mimeType ?? RAWBT_MIME_TYPE,
    orderNumber: context.orderNumber,
    receiptSummary: context.receiptSummary,
    payloadLength: bytes.length,
    payloadBase64Length: base64Data.length,
    payloadPreview: base64Preview(base64Data),
    payloadPreviewHex: bytesPreviewHex(bytes),
    base64RoundTripOk: roundTripOk,
    intentUri,
    schemeUri,
  });

  if (!roundTripOk) {
    rawbtLog.error('dispatch:base64-roundtrip-failed', { payloadLength: bytes.length });
    throw new Error('Gagal mengenkode data struk untuk RawBT');
  }

  try {
    rawbtLog.info('dispatch:attempt', { method: 'intent', mimeType: RAWBT_MIME_TYPE, intentUri });
    navigateRawBtIntent(intentUri);
    rawbtLog.info('dispatch:callback', { method: 'intent', status: 'dispatched' });
  } catch (error) {
    rawbtLog.error('dispatch:error', {
      method: 'intent',
      error: error instanceof Error ? error.message : String(error),
      intentUri,
    });

    if (isActivityNotFoundError(error)) {
      throw new RawBtNotInstalledError();
    }

    throw error;
  }
}
