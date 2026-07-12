const LOG_PREFIX = '[RawBT]';

export const RAWBT_MIME_TYPE = 'application/octet-stream';

export interface RawBtLogPayload {
  readonly intentUri?: string;
  readonly schemeUri?: string;
  readonly mimeType?: string;
  readonly renderer?: string;
  readonly payloadLength?: number;
  readonly payloadBase64Length?: number;
  readonly payloadPreview?: string;
  readonly payloadPreviewHex?: string;
  readonly orderNumber?: string;
  readonly method?: string;
  readonly status?: string;
  readonly error?: string;
  readonly receiptSummary?: Record<string, unknown>;
  readonly [key: string]: unknown;
}

function summarizeUri(uri: string, max = 160): string {
  if (uri.length <= max) return uri;
  return `${uri.slice(0, max)}… (${uri.length} chars)`;
}

export const rawbtLog = {
  info(event: string, payload: RawBtLogPayload = {}): void {
    if (typeof console === 'undefined') return;
    const sanitized = { ...payload };
    if (typeof sanitized.intentUri === 'string') {
      sanitized.intentUri = summarizeUri(sanitized.intentUri);
    }
    if (typeof sanitized.schemeUri === 'string') {
      sanitized.schemeUri = summarizeUri(sanitized.schemeUri);
    }
    console.info(LOG_PREFIX, event, sanitized);
  },

  error(event: string, payload: RawBtLogPayload = {}): void {
    if (typeof console === 'undefined') return;
    const sanitized = { ...payload };
    if (typeof sanitized.intentUri === 'string') {
      sanitized.intentUri = summarizeUri(sanitized.intentUri);
    }
    if (typeof sanitized.schemeUri === 'string') {
      sanitized.schemeUri = summarizeUri(sanitized.schemeUri);
    }
    console.error(LOG_PREFIX, event, sanitized);
  },
};

export function isActivityNotFoundError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const message = error.message.toLowerCase();
  return (
    message.includes('activity not found') ||
    message.includes('no activity found') ||
    message.includes('activitynotfoundexception') ||
    message.includes('no app found') ||
    message.includes('could not find') ||
    message.includes('unable to resolve') ||
    message.includes('unknown url scheme')
  );
}

export function bytesPreviewHex(bytes: Uint8Array, max = 16): string {
  const slice = bytes.subarray(0, max);
  return Array.from(slice)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join(' ');
}

export function base64Preview(base64: string, max = 100): string {
  return base64.length <= max ? base64 : `${base64.slice(0, max)}…`;
}

export function summarizeReceiptForLog(receipt: {
  orderNumber: string;
  grandTotal: number;
  items: readonly unknown[];
  paperWidth: string;
}): Record<string, unknown> {
  return {
    orderNumber: receipt.orderNumber,
    grandTotal: receipt.grandTotal,
    itemCount: receipt.items.length,
    paperWidth: receipt.paperWidth,
  };
}
