const LOG_PREFIX = '[RawBT]';

export interface RawBtLogPayload {
  readonly intentUrl?: string;
  readonly schemeUrl?: string;
  readonly payloadBase64Length?: number;
  readonly payloadBytesEstimate?: number;
  readonly method?: string;
  readonly status?: string;
  readonly error?: string;
  readonly [key: string]: unknown;
}

function summarizeUrl(url: string, max = 120): string {
  if (url.length <= max) return url;
  return `${url.slice(0, max)}… (${url.length} chars)`;
}

export const rawbtLog = {
  info(event: string, payload: RawBtLogPayload = {}): void {
    if (typeof console === 'undefined') return;
    const sanitized = { ...payload };
    if (typeof sanitized.intentUrl === 'string') {
      sanitized.intentUrl = summarizeUrl(sanitized.intentUrl);
    }
    if (typeof sanitized.schemeUrl === 'string') {
      sanitized.schemeUrl = summarizeUrl(sanitized.schemeUrl);
    }
    console.info(LOG_PREFIX, event, sanitized);
  },

  error(event: string, payload: RawBtLogPayload = {}): void {
    if (typeof console === 'undefined') return;
    const sanitized = { ...payload };
    if (typeof sanitized.intentUrl === 'string') {
      sanitized.intentUrl = summarizeUrl(sanitized.intentUrl);
    }
    if (typeof sanitized.schemeUrl === 'string') {
      sanitized.schemeUrl = summarizeUrl(sanitized.schemeUrl);
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
