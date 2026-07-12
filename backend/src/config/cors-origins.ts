const ORIGIN_PATTERN = /^https?:\/\/[^\s*/]+$/;

export class CorsOriginError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CorsOriginError';
  }
}

export function normalizeCorsOrigin(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) {
    throw new CorsOriginError('CORS origin must not be empty');
  }
  if (trimmed.includes('*')) {
    throw new CorsOriginError('CORS origin must not contain wildcard');
  }

  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    throw new CorsOriginError(`Invalid CORS origin URL: ${trimmed}`);
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new CorsOriginError(`CORS origin must use http or https: ${trimmed}`);
  }
  if (url.username || url.password) {
    throw new CorsOriginError(`CORS origin must not include userinfo: ${trimmed}`);
  }
  if (url.pathname !== '/' || url.search || url.hash) {
    throw new CorsOriginError(`CORS origin must not include path, query, or hash: ${trimmed}`);
  }

  const normalized = url.origin;
  if (!ORIGIN_PATTERN.test(normalized)) {
    throw new CorsOriginError(`Invalid CORS origin format: ${trimmed}`);
  }

  return normalized;
}

export function parseCorsOrigins(raw: string): string[] {
  const seen = new Set<string>();
  const origins: string[] = [];

  for (const part of raw.split(',')) {
    const trimmed = part.trim();
    if (!trimmed) continue;

    const normalized = normalizeCorsOrigin(trimmed);
    if (seen.has(normalized)) continue;

    seen.add(normalized);
    origins.push(normalized);
  }

  return origins;
}

export function isCorsOriginAllowed(origin: string, allowedOrigins: readonly string[]): boolean {
  try {
    const normalized = normalizeCorsOrigin(origin);
    return allowedOrigins.includes(normalized);
  } catch {
    return false;
  }
}
