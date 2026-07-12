import { describe, it, expect } from 'vitest';
import { Money } from '../../../src/domain/value-objects/Money.js';
import { DomainError } from '../../../src/domain/errors/DomainError.js';

describe('Money Value Object', () => {
  it('creates IDR money from string amount', () => {
    const money = Money.of('45000');
    expect(money.amount).toBe('45000');
    expect(money.currency).toBe('IDR');
    expect(money.precision).toBe(0);
  });

  it('adds same currency amounts', () => {
    const a = Money.of('1000');
    const b = Money.of('500');
    expect(a.add(b).amount).toBe('1500');
  });

  it('subtracts amounts', () => {
    const a = Money.of('1000');
    const b = Money.of('300');
    expect(a.subtract(b).amount).toBe('700');
  });

  it('multiplies by factor', () => {
    expect(Money.of('100').multiply(3).amount).toBe('300');
  });

  it('compares amounts', () => {
    expect(Money.of('100').compare(Money.of('200'))).toBe(-1);
    expect(Money.of('100').compare(Money.of('100'))).toBe(0);
    expect(Money.of('200').compare(Money.of('100'))).toBe(1);
  });

  it('detects zero', () => {
    expect(Money.zero().isZero()).toBe(true);
    expect(Money.of('1').isZero()).toBe(false);
  });

  it('allocates by ratios with remainder on last item', () => {
    const total = Money.of('100');
    const parts = total.allocate([1, 1, 1]);
    const sum = parts.reduce((acc, p) => acc.add(p), Money.zero());
    expect(sum.amount).toBe('100');
    expect(parts).toHaveLength(3);
  });

  it('throws on currency mismatch', () => {
    const idr = Money.of('100', 'IDR');
    const usd = Money.of('100', 'USD');
    expect(() => idr.add(usd)).toThrow(DomainError);
  });

  it('formats display for IDR', () => {
    const display = Money.of('45000').toDisplay();
    expect(display).toContain('45');
  });
});
