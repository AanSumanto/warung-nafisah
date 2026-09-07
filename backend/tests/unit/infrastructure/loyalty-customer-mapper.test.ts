import { describe, expect, it } from 'vitest';
import { Customer } from '../../../src/domain/loyalty/Customer.js';
import { CustomerMapper } from '../../../src/infrastructure/loyalty/mappers/CustomerMapper.js';

describe('CustomerMapper', () => {
  const mapper = new CustomerMapper();

  it('round-trips domain ↔ document with string id', () => {
    const customer = Customer.register({
      id: 'cust-map-1',
      phone: '081234567890',
      name: 'Budi',
      registeredBy: 'user_kasir',
    });

    const doc = mapper.toDocument(customer);
    expect(typeof doc._id).toBe('string');
    expect(doc._id).toBe('cust-map-1');
    expect(doc.phoneNormalized).toBe('6281234567890');
    expect(doc.currentPoints).toBe(0);

    const restored = mapper.toDomain(doc);
    expect(restored.id).toBe('cust-map-1');
    expect(restored.phoneNormalized).toBe('6281234567890');
    expect(restored.phoneMasked).toBe('0812******90');
    expect(restored.name).toBe('Budi');
    expect(restored.status).toBe('active');
  });

  it('normalizes ObjectId-like _id via documentId', () => {
    const customer = Customer.register({
      id: 'cust-map-2',
      phone: '6289876543210',
      registeredBy: 'user_owner',
    });
    const doc = mapper.toDocument(customer);
    const restored = mapper.toDomain({
      ...doc,
      _id: { toString: () => 'cust-map-2' } as unknown as string,
    });
    expect(restored.id).toBe('cust-map-2');
  });
});
