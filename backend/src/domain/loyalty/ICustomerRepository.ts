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

export interface CustomerRedeemMutation {
  readonly pointsRequired: number;
  readonly occurredAt: Date;
}

export interface CustomerRedeemMutationResult {
  readonly currentPoints: number;
}

export interface CustomerReversalMutation {
  /** Absolute points to reverse (positive). Applied as $inc -pointsToReverse. */
  readonly pointsToReverse: number;
  readonly occurredAt: Date;
}

export interface CustomerReversalMutationResult {
  readonly currentPoints: number;
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
  /**
   * Atomic guarded redeem: status active AND currentPoints >= pointsRequired.
   * Never allows negative balance from redemption itself.
   */
  applyRedeemMutation(
    customerId: Identifier,
    mutation: CustomerRedeemMutation,
  ): Promise<CustomerRedeemMutationResult>;
  /**
   * Atomic reverse of prior earn points. Intentionally allows negative currentPoints.
   * Does NOT decrement lifetimeEarnedPoints (gross earned remains).
   * Does NOT mutate totalSpending / transactionCount (deferred until operational refund).
   */
  applyReversalMutation(
    customerId: Identifier,
    mutation: CustomerReversalMutation,
  ): Promise<CustomerReversalMutationResult>;
  /**
   * Atomic signed delta for MANUAL_ADJUSTMENT. Allows negative balance.
   * Does NOT mutate lifetimeEarned / lifetimeRedeemed / spending counters.
   */
  applyAdjustmentMutation(
    customerId: Identifier,
    mutation: CustomerAdjustmentMutation,
  ): Promise<CustomerAdjustmentMutationResult>;
}

export interface CustomerAdjustmentMutation {
  readonly pointsDelta: number;
  readonly occurredAt: Date;
}

export interface CustomerAdjustmentMutationResult {
  readonly currentPoints: number;
}
