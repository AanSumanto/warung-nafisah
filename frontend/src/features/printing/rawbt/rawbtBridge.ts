import { isActivityNotFoundError, rawbtLog } from './rawbtLogger';
import { RawBtNotInstalledError } from '../types/printer';

export const RAWBT_PACKAGE = 'ru.a402d.rawbtprinter';

export const RAWBT_PLAY_STORE_URL = `https://play.google.com/store/apps/details?id=${RAWBT_PACKAGE}`;

export function isAndroidDevice(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /android/i.test(navigator.userAgent);
}

/** Encode ESC/POS bytes to base64 for RawBT intent payload. */
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
 * RawBT intent URL — recommended for web when package must be targeted.
 * @see https://rawbt.ru/start.html
 */
export function buildRawBtIntentUrl(base64Data: string): string {
  const payload = `rawbt:base64,${base64Data}`;
  return `intent:${payload}#Intent;scheme=rawbt;package=${RAWBT_PACKAGE};end;`;
}

/**
 * RawBT scheme URL — primary channel for ESC/POS binary (no distortion).
 * @see https://rawbt.ru/start.html
 */
export function buildRawBtSchemeUrl(base64Data: string): string {
  return `rawbt:base64,${base64Data}`;
}

/**
 * Dispatch ESC/POS payload to RawBT immediately.
 * No install probe, no timeout, no visibility heuristics.
 *
 * Throws RawBtNotInstalledError only when the browser surfaces an Activity Not Found
 * (or equivalent) error synchronously.
 */
export function dispatchRawBtPrint(base64Data: string): void {
  if (typeof window === 'undefined') {
    throw new Error('RawBT dispatch hanya tersedia di browser');
  }

  const schemeUrl = buildRawBtSchemeUrl(base64Data);
  const intentUrl = buildRawBtIntentUrl(base64Data);
  const payloadBytesEstimate = Math.floor((base64Data.length * 3) / 4);

  rawbtLog.info('dispatch:start', {
    payloadBase64Length: base64Data.length,
    payloadBytesEstimate,
    schemeUrl,
    intentUrl,
  });

  try {
    rawbtLog.info('dispatch:attempt', { method: 'scheme', schemeUrl });
    window.location.href = schemeUrl;
    rawbtLog.info('dispatch:callback', { method: 'scheme', status: 'dispatched' });
    return;
  } catch (error) {
    rawbtLog.error('dispatch:error', {
      method: 'scheme',
      error: error instanceof Error ? error.message : String(error),
    });

    if (isActivityNotFoundError(error)) {
      throw new RawBtNotInstalledError();
    }
  }

  try {
    rawbtLog.info('dispatch:attempt', { method: 'intent', intentUrl });
    window.location.href = intentUrl;
    rawbtLog.info('dispatch:callback', { method: 'intent', status: 'dispatched' });
  } catch (error) {
    rawbtLog.error('dispatch:error', {
      method: 'intent',
      error: error instanceof Error ? error.message : String(error),
    });

    if (isActivityNotFoundError(error)) {
      throw new RawBtNotInstalledError();
    }

    throw error;
  }
}
