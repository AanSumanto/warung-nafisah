import { DomainError } from '../errors/DomainError.js';

/**
 * Indonesian mobile phone normalization and masking.
 *
 * Canonical form: digits only with country code 62 (no '+'), e.g. 6281234567890.
 * Local 08… and +62… inputs normalize to the same value.
 */

/** Minimum length of canonical form: 62 + 8 digits (e.g. 6281234567). */
const MIN_CANONICAL_LENGTH = 10;
/** Maximum length of canonical form: 62 + 13 digits. */
const MAX_CANONICAL_LENGTH = 15;

/**
 * Normalize an Indonesian phone input to canonical `62…` digits.
 * @throws DomainError when input is empty, malformed, or out of length range.
 */
export function normalizePhoneId(input: string): string {
  if (typeof input !== 'string') {
    throw DomainError.invalidArgument('Nomor HP tidak valid', 'phone');
  }

  let raw = input.trim();
  if (!raw) {
    throw DomainError.invalidArgument('Nomor HP wajib diisi', 'phone');
  }

  // Strip common separators (spaces, dashes, parentheses, dots)
  raw = raw.replace(/[\s\-().]/g, '');

  if (raw.startsWith('+')) {
    raw = raw.slice(1);
  }

  if (!/^\d+$/.test(raw)) {
    throw DomainError.invalidArgument('Nomor HP hanya boleh berisi angka', 'phone');
  }

  let canonical: string;
  if (raw.startsWith('62')) {
    canonical = raw;
  } else if (raw.startsWith('0')) {
    if (raw.length < 2) {
      throw DomainError.invalidArgument('Nomor HP tidak valid', 'phone');
    }
    canonical = `62${raw.slice(1)}`;
  } else {
    throw DomainError.invalidArgument(
      'Nomor HP harus diawali 0, 62, atau +62',
      'phone',
    );
  }

  if (canonical.length < MIN_CANONICAL_LENGTH || canonical.length > MAX_CANONICAL_LENGTH) {
    throw DomainError.invalidArgument('Panjang nomor HP tidak valid', 'phone');
  }

  // After country code, Indonesian numbers do not start with 0
  if (canonical[2] === '0') {
    throw DomainError.invalidArgument('Nomor HP tidak valid', 'phone');
  }

  return canonical;
}

/**
 * Mask a canonical `62…` phone for display.
 * Example: 6281234567890 → 0812******90
 */
export function maskPhone(phoneNormalized: string): string {
  if (typeof phoneNormalized !== 'string' || !phoneNormalized.startsWith('62')) {
    throw DomainError.invalidArgument('Nomor HP canonical tidak valid', 'phone');
  }

  const local = `0${phoneNormalized.slice(2)}`;
  if (local.length < 6) {
    throw DomainError.invalidArgument('Nomor HP terlalu pendek untuk di-mask', 'phone');
  }

  const prefixLen = 4;
  const suffixLen = 2;
  const prefix = local.slice(0, prefixLen);
  const suffix = local.slice(-suffixLen);
  const maskLen = Math.max(local.length - prefixLen - suffixLen, 4);
  return `${prefix}${'*'.repeat(maskLen)}${suffix}`;
}

export function tryNormalizePhoneId(input: string): string | null {
  try {
    return normalizePhoneId(input);
  } catch {
    return null;
  }
}
