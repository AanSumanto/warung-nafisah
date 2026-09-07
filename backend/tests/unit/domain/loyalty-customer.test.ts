import { describe, expect, it } from 'vitest';
import { Customer } from '../../../src/domain/loyalty/Customer.js';
import { DomainError } from '../../../src/domain/errors/DomainError.js';

describe('Customer aggregate', () => {
  it('registers with zero counters and active status', () => {
    const customer = Customer.register({
      id: 'cust-1',
      phone: '081234567890',
      name: '  Aan  ',
      registeredBy: 'user_kasir',
    });

    expect(customer.id).toBe('cust-1');
    expect(customer.phoneNormalized).toBe('6281234567890');
    expect(customer.phoneMasked).toBe('0812******90');
    expect(customer.name).toBe('Aan');
    expect(customer.currentPoints).toBe(0);
    expect(customer.lifetimeEarnedPoints).toBe(0);
    expect(customer.lifetimeRedeemedPoints).toBe(0);
    expect(customer.totalSpending).toBe(0);
    expect(customer.transactionCount).toBe(0);
    expect(customer.lastTransactionAt).toBeNull();
    expect(customer.status).toBe('active');
    expect(customer.registeredBy).toBe('user_kasir');
    expect(customer.publicMemberId.length).toBe(32);
  });

  it('treats empty name as undefined', () => {
    const customer = Customer.register({
      id: 'cust-2',
      phone: '+6281234567890',
      name: '   ',
      registeredBy: 'user_owner',
    });
    expect(customer.name).toBeUndefined();
  });

  it('rejects missing registeredBy', () => {
    expect(() =>
      Customer.register({
        id: 'cust-3',
        phone: '081234567890',
        registeredBy: '',
      }),
    ).toThrow(DomainError);
  });

  it('rejects oversized name', () => {
    expect(() =>
      Customer.register({
        id: 'cust-4',
        phone: '081234567890',
        name: 'A'.repeat(121),
        registeredBy: 'user_kasir',
      }),
    ).toThrow(DomainError);
  });

  it('does not accept caller-supplied point balances via register', () => {
    const customer = Customer.register({
      id: 'cust-5',
      phone: '081234567890',
      registeredBy: 'user_kasir',
    });
    // RegisterCustomerInput has no points fields — counters always zero
    expect(customer.currentPoints).toBe(0);
    expect(customer.lifetimeEarnedPoints).toBe(0);
  });
});
