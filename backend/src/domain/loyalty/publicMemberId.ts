import { randomBytes } from 'node:crypto';
import { DomainError } from '../errors/DomainError.js';

/** 24 bytes → 32-char base64url; ~192 bits entropy. */
const PUBLIC_MEMBER_ID_BYTES = 24;

const PUBLIC_MEMBER_ID_PATTERN = /^[A-Za-z0-9_-]{32}$/;

/**
 * Generate a cryptographically secure, URL-safe public member identifier.
 * Opaque — not derived from phone, MongoDB id, or sequential counters.
 * Designed so a future rotation can replace the active value.
 */
export function generatePublicMemberId(): string {
  return randomBytes(PUBLIC_MEMBER_ID_BYTES).toString('base64url');
}

export function assertPublicMemberIdFormat(value: string): void {
  if (typeof value !== 'string' || !PUBLIC_MEMBER_ID_PATTERN.test(value)) {
    throw DomainError.invalidArgument('publicMemberId format tidak valid', 'publicMemberId');
  }
}

export function isUrlSafePublicMemberId(value: string): boolean {
  return typeof value === 'string' && PUBLIC_MEMBER_ID_PATTERN.test(value);
}
