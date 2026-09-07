import { randomUUID } from 'node:crypto';
import {
  NotFoundException,
  ValidationException,
} from '../../core/exceptions/BaseException.js';
import { createIdentifier } from '../../domain/common/Identifier.js';
import { Customer } from '../../domain/loyalty/Customer.js';
import type { ICustomerRepository } from '../../domain/loyalty/ICustomerRepository.js';
import { DomainError } from '../../domain/errors/DomainError.js';
import { normalizePhoneId } from '../../domain/loyalty/phone.js';

export interface CustomerDto {
  readonly id: string;
  readonly publicMemberId: string;
  readonly phoneMasked: string;
  readonly name?: string;
  readonly currentPoints: number;
  readonly lifetimeEarnedPoints: number;
  readonly lifetimeRedeemedPoints: number;
  readonly totalSpending: number;
  readonly transactionCount: number;
  readonly lastTransactionAt: string | null;
  readonly status: string;
  readonly registeredAt: string;
}

export interface RegisterCustomerCommand {
  readonly phone: string;
  readonly name?: string;
  /** Authenticated actor user id — never from untrusted body. */
  readonly registeredBy: string;
}

function isDuplicateKeyError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const code = (error as { code?: number }).code;
  if (code === 11000) return true;
  const message = error instanceof Error ? error.message : String(error);
  return message.includes('E11000') || message.includes('duplicate key');
}

function duplicateKeyField(error: unknown): 'phoneNormalized' | 'publicMemberId' | 'unknown' {
  const message = error instanceof Error ? error.message : String(error);
  if (message.includes('phoneNormalized')) return 'phoneNormalized';
  if (message.includes('publicMemberId')) return 'publicMemberId';
  const keyPattern = (error as { keyPattern?: Record<string, unknown> }).keyPattern;
  if (keyPattern?.phoneNormalized !== undefined) return 'phoneNormalized';
  if (keyPattern?.publicMemberId !== undefined) return 'publicMemberId';
  return 'unknown';
}

function toValidation(error: unknown): never {
  if (error instanceof DomainError) {
    throw new ValidationException(error.message, error.field ? { field: error.field } : undefined);
  }
  throw error;
}

export function toCustomerDto(customer: Customer): CustomerDto {
  return {
    id: customer.id,
    publicMemberId: customer.publicMemberId,
    phoneMasked: customer.phoneMasked,
    name: customer.name,
    currentPoints: customer.currentPoints,
    lifetimeEarnedPoints: customer.lifetimeEarnedPoints,
    lifetimeRedeemedPoints: customer.lifetimeRedeemedPoints,
    totalSpending: customer.totalSpending,
    transactionCount: customer.transactionCount,
    lastTransactionAt: customer.lastTransactionAt
      ? customer.lastTransactionAt.toISOString()
      : null,
    status: customer.status,
    registeredAt: customer.registeredAt.toISOString(),
  };
}

export class CustomerService {
  constructor(private readonly customers: ICustomerRepository) {}

  async register(command: RegisterCustomerCommand): Promise<CustomerDto> {
    let customer: Customer;
    try {
      customer = Customer.register({
        id: randomUUID(),
        phone: command.phone,
        name: command.name,
        registeredBy: command.registeredBy,
      });
    } catch (error) {
      toValidation(error);
    }

    const existing = await this.customers.findByPhoneNormalized(customer.phoneNormalized);
    if (existing) {
      throw new ValidationException('Nomor HP sudah terdaftar', {
        code: 'CUSTOMER_ALREADY_EXISTS',
      });
    }

    try {
      const saved = await this.customers.save(customer);
      return toCustomerDto(saved);
    } catch (error) {
      if (isDuplicateKeyError(error)) {
        const field = duplicateKeyField(error);
        if (field === 'publicMemberId') {
          // Extremely unlikely collision — retry once with a fresh token
          try {
            const retry = Customer.register({
              id: randomUUID(),
              phone: command.phone,
              name: command.name,
              registeredBy: command.registeredBy,
            });
            const saved = await this.customers.save(retry);
            return toCustomerDto(saved);
          } catch (retryError) {
            if (isDuplicateKeyError(retryError)) {
              throw new ValidationException('Nomor HP sudah terdaftar', {
                code: 'CUSTOMER_ALREADY_EXISTS',
              });
            }
            throw retryError;
          }
        }
        throw new ValidationException('Nomor HP sudah terdaftar', {
          code: 'CUSTOMER_ALREADY_EXISTS',
        });
      }
      throw error;
    }
  }

  async lookupByPhone(phone: string): Promise<CustomerDto> {
    let phoneNormalized: string;
    try {
      phoneNormalized = normalizePhoneId(phone);
    } catch (error) {
      toValidation(error);
    }

    const customer = await this.customers.findByPhoneNormalized(phoneNormalized);
    if (!customer) {
      throw new NotFoundException('Pelanggan tidak ditemukan', {
        code: 'CUSTOMER_NOT_FOUND',
      });
    }
    return toCustomerDto(customer);
  }

  async getById(customerId: string): Promise<CustomerDto> {
    if (!customerId || !customerId.trim()) {
      throw new ValidationException('Customer id tidak valid', {
        code: 'CUSTOMER_INVALID_ID',
      });
    }

    const customer = await this.customers.findById(createIdentifier(customerId.trim()));
    if (!customer) {
      throw new NotFoundException('Pelanggan tidak ditemukan', {
        code: 'CUSTOMER_NOT_FOUND',
      });
    }
    return toCustomerDto(customer);
  }
}
