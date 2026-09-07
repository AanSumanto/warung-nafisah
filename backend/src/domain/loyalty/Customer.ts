import { BaseEntity } from '../base/BaseEntity.js';
import type { Identifier } from '../common/Identifier.js';
import { createIdentifier } from '../common/Identifier.js';
import { DomainError } from '../errors/DomainError.js';
import { CUSTOMER_STATUSES, type CustomerStatus } from './LoyaltyTypes.js';
import { maskPhone, normalizePhoneId } from './phone.js';
import { assertPublicMemberIdFormat, generatePublicMemberId } from './publicMemberId.js';

const MAX_NAME_LENGTH = 120;

export interface CustomerProps extends Record<string, unknown> {
  publicMemberId: string;
  phoneNormalized: string;
  phoneMasked: string;
  name?: string;
  currentPoints: number;
  lifetimeEarnedPoints: number;
  lifetimeRedeemedPoints: number;
  totalSpending: number;
  transactionCount: number;
  lastTransactionAt?: Date | null;
  status: CustomerStatus;
  registeredAt: Date;
  registeredBy: string;
}

export interface RegisterCustomerInput {
  readonly id: string;
  readonly phone: string;
  readonly name?: string;
  readonly registeredBy: string;
  readonly publicMemberId?: string;
}

export class Customer extends BaseEntity<CustomerProps> {
  private constructor(props: CustomerProps, id: Identifier, createdAt: Date, updatedAt: Date) {
    super(props, id, createdAt, updatedAt);
  }

  /**
   * Register a new member. Counters are system-initialized to zero.
   * Callers cannot supply point balances via this factory.
   */
  static register(input: RegisterCustomerInput): Customer {
    if (!input.registeredBy || !input.registeredBy.trim()) {
      throw DomainError.invalidArgument('registeredBy is required', 'registeredBy');
    }

    const phoneNormalized = normalizePhoneId(input.phone);
    const phoneMasked = maskPhone(phoneNormalized);
    const name = Customer.normalizeOptionalName(input.name);
    const publicMemberId = input.publicMemberId ?? generatePublicMemberId();
    assertPublicMemberIdFormat(publicMemberId);

    const now = new Date();
    return new Customer(
      {
        publicMemberId,
        phoneNormalized,
        phoneMasked,
        name,
        currentPoints: 0,
        lifetimeEarnedPoints: 0,
        lifetimeRedeemedPoints: 0,
        totalSpending: 0,
        transactionCount: 0,
        lastTransactionAt: null,
        status: 'active',
        registeredAt: now,
        registeredBy: input.registeredBy.trim(),
      },
      createIdentifier(input.id),
      now,
      now,
    );
  }

  static reconstitute(
    id: string,
    props: CustomerProps,
    createdAt: Date,
    updatedAt: Date,
  ): Customer {
    return new Customer(props, createIdentifier(id), createdAt, updatedAt);
  }

  private static normalizeOptionalName(name?: string): string | undefined {
    if (name === undefined || name === null) return undefined;
    if (typeof name !== 'string') {
      throw DomainError.invalidArgument('Nama tidak valid', 'name');
    }
    const trimmed = name.trim();
    if (!trimmed) return undefined;
    if (trimmed.length > MAX_NAME_LENGTH) {
      throw DomainError.invalidArgument(
        `Nama maksimal ${MAX_NAME_LENGTH} karakter`,
        'name',
      );
    }
    return trimmed;
  }

  get publicMemberId(): string {
    return this.props.publicMemberId;
  }

  get phoneNormalized(): string {
    return this.props.phoneNormalized;
  }

  get phoneMasked(): string {
    return this.props.phoneMasked;
  }

  get name(): string | undefined {
    return this.props.name;
  }

  get currentPoints(): number {
    return this.props.currentPoints;
  }

  get lifetimeEarnedPoints(): number {
    return this.props.lifetimeEarnedPoints;
  }

  get lifetimeRedeemedPoints(): number {
    return this.props.lifetimeRedeemedPoints;
  }

  get totalSpending(): number {
    return this.props.totalSpending;
  }

  get transactionCount(): number {
    return this.props.transactionCount;
  }

  get lastTransactionAt(): Date | null | undefined {
    return this.props.lastTransactionAt;
  }

  get status(): CustomerStatus {
    return this.props.status;
  }

  get registeredAt(): Date {
    return this.props.registeredAt;
  }

  get registeredBy(): string {
    return this.props.registeredBy;
  }

  isActive(): boolean {
    return this.props.status === 'active';
  }

  toRecord(): CustomerProps {
    return {
      ...this.props,
      name: this.props.name,
      lastTransactionAt: this.props.lastTransactionAt ?? null,
    };
  }

  static isValidStatus(value: string): value is CustomerStatus {
    return (CUSTOMER_STATUSES as readonly string[]).includes(value);
  }
}
