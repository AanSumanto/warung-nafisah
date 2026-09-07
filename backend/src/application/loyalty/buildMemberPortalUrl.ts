import { isUrlSafePublicMemberId } from '../../domain/loyalty/publicMemberId.js';

/**
 * Centralized member portal URL builder.
 * Portal page itself is LOYALTY-06 — this only builds the opaque path.
 */
export function buildMemberPortalUrl(publicOrigin: string, publicMemberId: string): string {
  const origin = publicOrigin.trim().replace(/\/+$/, '');
  if (!origin) {
    throw new Error('PUBLIC_APP_URL is required to build member portal URL');
  }
  if (!isUrlSafePublicMemberId(publicMemberId)) {
    throw new Error('publicMemberId is invalid');
  }

  let parsed: URL;
  try {
    parsed = new URL(origin);
  } catch {
    throw new Error('PUBLIC_APP_URL is not a valid URL');
  }

  if (parsed.protocol !== 'https:' && parsed.hostname !== 'localhost' && parsed.hostname !== '127.0.0.1') {
    throw new Error('PUBLIC_APP_URL must use HTTPS outside localhost');
  }

  // Opaque path only — no phone, customerId, or query PII
  return `${parsed.origin}/rewards/member/${publicMemberId}`;
}
