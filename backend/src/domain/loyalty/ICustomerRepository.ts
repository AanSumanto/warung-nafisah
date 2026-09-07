import type { Identifier } from '../common/Identifier.js';
import type { Customer } from './Customer.js';

export interface CustomerEarnMutation {
  readonly pointsDelta: number;
  readonly eligiblePaidAmount: number;
  readonly occurredAt: Date;
}

export interface CustomerEarnMutationResult {
  readonly currentPoints: number;
  readonly lifetimeEarnedPoints: number;
  readonly totalSpending: number;
  readonly transactionCount: number;
  readonly lastTransactionAt: Date;
}

export interface ICustomerRepository {
  save(customer: Customer): Promise<Customer>;
  findById(id: Identifier): Promise<Customer | null>;
  findByPhoneNormalized(phoneNormalized: string): Promise<Customer | null>;
  findByPublicMemberId(publicMemberId: string): Promise<Customer | null>;
  /**
   * Atomic $inc earn counters within the active Mongo session.
   * Returns the post-mutation balance used as ledger balanceAfter.
   */
  applyEarnMutation(
    customerId: Identifier,
    mutation: CustomerEarnMutation,
  ): Promise<CustomerEarnMutationResult>;
}
