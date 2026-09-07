import { Customer } from '../../../domain/loyalty/Customer.js';
import type { CustomerStatus } from '../../../domain/loyalty/LoyaltyTypes.js';
import { BaseMongoMapper } from '../../persistence/mappers/MongoMapper.js';
import type { CustomerDocument } from '../documents/CustomerDocument.js';

function asNonNegativeInt(value: unknown, field: string): number {
  if (typeof value !== 'number' || !Number.isInteger(value) || value < 0) {
    throw new Error(`Customer document field ${field} is invalid`);
  }
  return value;
}

function asDate(value: unknown, field: string): Date {
  if (!(value instanceof Date) || Number.isNaN(value.getTime())) {
    throw new Error(`Customer document field ${field} is invalid`);
  }
  return value;
}

function asOptionalDate(value: unknown): Date | null {
  if (value == null) return null;
  if (!(value instanceof Date) || Number.isNaN(value.getTime())) {
    throw new Error('Customer document field lastTransactionAt is invalid');
  }
  return value;
}

function asStatus(value: unknown): CustomerStatus {
  if (value === 'active' || value === 'blocked') return value;
  throw new Error('Customer document field status is invalid');
}

export class CustomerMapper extends BaseMongoMapper<Customer, CustomerDocument> {
  toDocument(entity: Customer): CustomerDocument {
    const doc: CustomerDocument = {
      _id: entity.id,
      publicMemberId: entity.publicMemberId,
      phoneNormalized: entity.phoneNormalized,
      phoneMasked: entity.phoneMasked,
      currentPoints: entity.currentPoints,
      lifetimeEarnedPoints: entity.lifetimeEarnedPoints,
      lifetimeRedeemedPoints: entity.lifetimeRedeemedPoints,
      totalSpending: entity.totalSpending,
      transactionCount: entity.transactionCount,
      lastTransactionAt: entity.lastTransactionAt ?? null,
      status: entity.status,
      registeredAt: entity.registeredAt,
      registeredBy: entity.registeredBy,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
    if (entity.name !== undefined) {
      doc.name = entity.name;
    }
    return doc;
  }

  toDomain(document: CustomerDocument): Customer {
    const id = this.documentId(document);
    return Customer.reconstitute(
      id,
      {
        publicMemberId: String(document.publicMemberId),
        phoneNormalized: String(document.phoneNormalized),
        phoneMasked: String(document.phoneMasked),
        name: document.name ? String(document.name) : undefined,
        currentPoints: asNonNegativeInt(document.currentPoints, 'currentPoints'),
        lifetimeEarnedPoints: asNonNegativeInt(
          document.lifetimeEarnedPoints,
          'lifetimeEarnedPoints',
        ),
        lifetimeRedeemedPoints: asNonNegativeInt(
          document.lifetimeRedeemedPoints,
          'lifetimeRedeemedPoints',
        ),
        totalSpending: asNonNegativeInt(document.totalSpending, 'totalSpending'),
        transactionCount: asNonNegativeInt(document.transactionCount, 'transactionCount'),
        lastTransactionAt: asOptionalDate(document.lastTransactionAt),
        status: asStatus(document.status),
        registeredAt: asDate(document.registeredAt, 'registeredAt'),
        registeredBy: String(document.registeredBy),
      },
      asDate(document.createdAt, 'createdAt'),
      asDate(document.updatedAt, 'updatedAt'),
    );
  }
}
