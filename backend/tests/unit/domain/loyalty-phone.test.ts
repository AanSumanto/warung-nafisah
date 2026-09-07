import { describe, expect, it } from 'vitest';
import { DomainError } from '../../../src/domain/errors/DomainError.js';
import { maskPhone, normalizePhoneId } from '../../../src/domain/loyalty/phone.js';

describe('normalizePhoneId', () => {
  it('normalizes 08, 62, and +62 to the same canonical value', () => {
    const a = normalizePhoneId('081234567890');
    const b = normalizePhoneId('6281234567890');
    const c = normalizePhoneId('+6281234567890');
    expect(a).toBe('6281234567890');
    expect(b).toBe(a);
    expect(c).toBe(a);
  });

  it('trims surrounding whitespace', () => {
    expect(normalizePhoneId('  081234567890  ')).toBe('6281234567890');
  });

  it('strips common separators', () => {
    expect(normalizePhoneId('0812-3456-7890')).toBe('6281234567890');
    expect(normalizePhoneId('(0812) 3456 7890')).toBe('6281234567890');
  });

  it('rejects empty input', () => {
    expect(() => normalizePhoneId('')).toThrow(DomainError);
    expect(() => normalizePhoneId('   ')).toThrow(DomainError);
  });

  it('rejects alphabetic input', () => {
    expect(() => normalizePhoneId('abcdefghijk')).toThrow(DomainError);
    expect(() => normalizePhoneId('0812ABCD7890')).toThrow(DomainError);
  });

  it('rejects too-short input', () => {
    expect(() => normalizePhoneId('0812')).toThrow(DomainError);
    expect(() => normalizePhoneId('62812')).toThrow(DomainError);
  });

  it('rejects unreasonably long input', () => {
    expect(() => normalizePhoneId(`62${'8'.repeat(20)}`)).toThrow(DomainError);
  });

  it('rejects malformed country prefix', () => {
    expect(() => normalizePhoneId('1234567890')).toThrow(DomainError);
    expect(() => normalizePhoneId('+1234567890')).toThrow(DomainError);
    expect(() => normalizePhoneId('62081234567890')).toThrow(DomainError);
  });
});

describe('maskPhone', () => {
  it('masks canonical phone for display', () => {
    expect(maskPhone('6281234567890')).toBe('0812******90');
  });

  it('does not return the full canonical number', () => {
    const masked = maskPhone('6281234567890');
    expect(masked).not.toContain('6281234567890');
    expect(masked).not.toBe('081234567890');
    expect(masked.includes('*')).toBe(true);
  });

  it('works consistently for supported lengths', () => {
    expect(maskPhone('62812345678')).toMatch(/^0812\*+\d{2}$/);
    expect(maskPhone('62812345678901')).toMatch(/^0812\*+\d{2}$/);
  });
});
