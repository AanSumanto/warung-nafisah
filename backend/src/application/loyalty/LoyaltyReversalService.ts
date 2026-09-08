import { randomUUID } from 'node:crypto';
import {
  NotFoundException,
  ValidationException,
} from '../../core/exceptions/BaseException.js';
import { createIdentifier } from '../../domain/common/Identifier.js';
import { LoyaltyLedgerEntry } from '../../domain/loyalty/LoyaltyLedgerEntry.js';
import type { ICustomerRepository } from '../../domain/loyalty/ICustomerRepository.js';
import type { ILoyaltyLedgerRepository } from '../../domain/loyalty/ILoyaltyLedgerRepository.js';
import {
  buildEarnSaleIdempotencyKey,
  buildReversalRefundIdempotencyKey,
  buildReversalVoidIdempotencyKey,
} from '../../domain/loyalty/LoyaltyLedgerTypes.js';
import type { MongoUnitOfWork } from '../../infrastructure/persistence/MongoUnitOfWork.js';
import { withTransactionRetry } from '../../infrastructure/database/transaction-retry.js';

export type LoyaltyReversalOperation = 'REFUND' | 'VOID';

export interface LoyaltyReverseEarnInput {
  /** Original paid order id that produced EARN_SALE. */
  readonly originalOrderId: string;
  /** Optional — must match earn customer when provided. */
  readonly customerId?: string;
  /**
   * Future multi-refund identifier. Omitted for platforms with only full refund.
   * Today: no operational refund API — callers (future) supply platform refund id.
   */
  readonly refundBusinessRef?: string;
  readonly voidBusinessRef?: string;
  readonly reason?: string;
  readonly actorUserId?: string;
  readonly occurredAt: Date;
}

export interface LoyaltyReverseEarnResult {
  readonly customerId: string;
  readonly originalOrderId: string;
  readonly originalLedgerEntryId: string;
  readonly pointsReversed: number;
  readonly balanceAfter: number;
  readonly ledgerEntryId: string | null;
  readonly operation: LoyaltyReversalOperation;
  readonly alreadyProcessed: boolean;
  /** True when original earn was +0 — no ledger row appended. */
  readonly skippedZeroEarn: boolean;
  readonly processedAt: string;
}

/** Unique-key race lost on ledger append; transaction must roll back. */
export class ReversalIdempotentRaceError extends Error {
  constructor(readonly idempotencyKey: string) {
    super('LOYALTY_REVERSAL_IDEMPOTENT_RACE');
    this.name = 'ReversalIdempotentRaceError';
  }
}

function isDuplicateKeyError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const code = (error as { code?: number }).code;
  if (code === 11000) return true;
  const message = error instanceof Error ? error.message : String(error);
  return message.includes('E11000') || message.includes('duplicate key');
}

function isAbortedTransactionError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  const lower = message.toLowerCase();
  return (
    lower.includes('has been aborted') ||
    lower.includes('transactionaborted') ||
    lower.includes('transienttransactionerror') ||
    lower.includes('write conflict') ||
    lower.includes('writeconflict')
  );
}

function assertReverseInput(input: LoyaltyReverseEarnInput): void {
  if (!input.originalOrderId?.trim()) {
    throw new ValidationException('originalOrderId wajib diisi', {
      code: 'LOYALTY_REVERSAL_INVALID_ORDER',
    });
  }
  if (!(input.occurredAt instanceof Date) || Number.isNaN(input.occurredAt.getTime())) {
    throw new ValidationException('occurredAt tidak valid', {
      code: 'LOYALTY_REVERSAL_INVALID_OCCURRED_AT',
    });
  }
}

/**
 * Internal earn-reversal capability — NO public HTTP route.
 *
 * Must be invoked only from a real refund/void financial UoW when that exists.
 * Platform today has no paid refund/void; this service is the foundation only.
 *
 * Amount comes exclusively from historical EARN_SALE.pointsDelta.
 * Negative balance is allowed. lifetimeEarnedPoints is not decremented.
 * REDEEM_REWARD is never restored by ordinary refund.
 */
export class LoyaltyReversalService {
  constructor(
    private readonly customers: ICustomerRepository,
    private readonly ledger: ILoyaltyLedgerRepository,
    private readonly unitOfWork: MongoUnitOfWork,
  ) {}

  async reverseEarnForRefund(input: LoyaltyReverseEarnInput): Promise<LoyaltyReverseEarnResult> {
    return this.reverseEarn(input, 'REFUND');
  }

  async reverseEarnForVoid(input: LoyaltyReverseEarnInput): Promise<LoyaltyReverseEarnResult> {
    return this.reverseEarn(input, 'VOID');
  }

  private async reverseEarn(
    input: LoyaltyReverseEarnInput,
    operation: LoyaltyReversalOperation,
  ): Promise<LoyaltyReverseEarnResult> {
    assertReverseInput(input);

    const loadOriginal = async () => this.loadOriginalEarn(input);

    try {
      if (this.unitOfWork.getActiveSession()) {
        const original = await loadOriginal();
        return await this.executeReversal(input, operation, original);
      }
      return await withTransactionRetry(
        async () => {
          try {
            return await this.unitOfWork.execute(async () => {
              const original = await loadOriginal();
              return this.executeReversal(input, operation, original);
            });
          } catch (error) {
            const recovered = await this.tryRecover(error, input, operation);
            if (recovered) return recovered;
            throw error;
          }
        },
        { maxAttempts: 12, baseDelayMs: 25 },
      );
    } catch (error) {
      const recovered = await this.tryRecover(error, input, operation);
      if (recovered) return recovered;
      throw error;
    }
  }

  private async tryRecover(
    error: unknown,
    input: LoyaltyReverseEarnInput,
    operation: LoyaltyReversalOperation,
  ): Promise<LoyaltyReverseEarnResult | null> {
    const shouldRecover =
      error instanceof ReversalIdempotentRaceError ||
      isDuplicateKeyError(error) ||
      isAbortedTransactionError(error);
    if (!shouldRecover) return null;

    const original = await this.loadOriginalEarn(input);
    if (original.pointsDelta === 0) {
      const customer = await this.customers.findById(createIdentifier(original.customerId));
      return {
        customerId: original.customerId,
        originalOrderId:
          original.metadata.kind === 'EARN_SALE'
            ? original.metadata.orderId
            : input.originalOrderId.trim(),
        originalLedgerEntryId: original.id,
        pointsReversed: 0,
        balanceAfter: customer?.currentPoints ?? original.balanceAfter,
        ledgerEntryId: null,
        operation,
        alreadyProcessed: true,
        skippedZeroEarn: true,
        processedAt: input.occurredAt.toISOString(),
      };
    }
    const key = this.idempotencyKeyFor(original.id, input, operation);
    const existing = await this.ledger.findByIdempotencyKey(key);
    if (!existing) return null;
    return this.resolveExisting(existing, original, operation);
  }

  private async loadOriginalEarn(input: LoyaltyReverseEarnInput): Promise<LoyaltyLedgerEntry> {
    const orderId = input.originalOrderId.trim();
    const earnKey = buildEarnSaleIdempotencyKey(orderId);
    const earn = await this.ledger.findByIdempotencyKey(earnKey);
    if (!earn) {
      throw new NotFoundException('EARN_SALE asli tidak ditemukan untuk order ini', {
        code: 'LOYALTY_REVERSAL_EARN_NOT_FOUND',
      });
    }
    if (earn.type !== 'EARN_SALE') {
      throw new ValidationException('Ledger entry bukan EARN_SALE', {
        code: 'LOYALTY_REVERSAL_INVALID_EARN_TYPE',
      });
    }
    if (input.customerId?.trim() && earn.customerId !== input.customerId.trim()) {
      throw new ValidationException('Customer tidak cocok dengan EARN_SALE', {
        code: 'LOYALTY_REVERSAL_CUSTOMER_MISMATCH',
      });
    }
    return earn;
  }

  private idempotencyKeyFor(
    originalEarnLedgerId: string,
    input: LoyaltyReverseEarnInput,
    operation: LoyaltyReversalOperation,
  ): string {
    if (operation === 'VOID') {
      return buildReversalVoidIdempotencyKey(originalEarnLedgerId);
    }
    return buildReversalRefundIdempotencyKey(originalEarnLedgerId, input.refundBusinessRef);
  }

  private async executeReversal(
    input: LoyaltyReverseEarnInput,
    operation: LoyaltyReversalOperation,
    original: LoyaltyLedgerEntry,
  ): Promise<LoyaltyReverseEarnResult> {
    if (original.pointsDelta === 0) {
      const customer = await this.customers.findById(createIdentifier(original.customerId));
      return {
        customerId: original.customerId,
        originalOrderId:
          original.metadata.kind === 'EARN_SALE'
            ? original.metadata.orderId
            : input.originalOrderId.trim(),
        originalLedgerEntryId: original.id,
        pointsReversed: 0,
        balanceAfter: customer?.currentPoints ?? original.balanceAfter,
        ledgerEntryId: null,
        operation,
        alreadyProcessed: true,
        skippedZeroEarn: true,
        processedAt: input.occurredAt.toISOString(),
      };
    }

    const idempotencyKey = this.idempotencyKeyFor(original.id, input, operation);
    const existing = await this.ledger.findByIdempotencyKey(idempotencyKey);
    if (existing) {
      return this.resolveExisting(existing, original, operation);
    }

    const customer = await this.customers.findById(createIdentifier(original.customerId));
    if (!customer) {
      throw new NotFoundException('Pelanggan tidak ditemukan', {
        code: 'LOYALTY_REVERSAL_CUSTOMER_NOT_FOUND',
      });
    }
    if (customer.status === 'blocked') {
      throw new ValidationException('Pelanggan diblokir; tidak dapat membalik poin', {
        code: 'LOYALTY_REVERSAL_CUSTOMER_BLOCKED',
      });
    }

    const pointsToReverse = original.pointsDelta;

    let mutation;
    try {
      mutation = await this.customers.applyReversalMutation(createIdentifier(customer.id), {
        pointsToReverse,
        occurredAt: input.occurredAt,
      });
    } catch (error) {
      if (error instanceof Error && error.message === 'CUSTOMER_REVERSAL_MUTATION_FAILED') {
        throw new ValidationException('Pelanggan diblokir atau tidak ditemukan', {
          code: 'LOYALTY_REVERSAL_CUSTOMER_BLOCKED',
        });
      }
      throw error;
    }

    const actor = input.actorUserId
      ? ({ type: 'USER' as const, userId: input.actorUserId })
      : ({ type: 'SYSTEM' as const });

    const entry =
      operation === 'VOID'
        ? LoyaltyLedgerEntry.createReversalVoid({
            id: randomUUID(),
            customerId: customer.id,
            pointsReversed: pointsToReverse,
            balanceAfter: mutation.currentPoints,
            originalLedgerEntryId: original.id,
            originalOrderId: input.originalOrderId.trim(),
            idempotencyKey,
            programSnapshot: { ...original.programSnapshot },
            reason: input.reason,
            voidBusinessRef: input.voidBusinessRef,
            actor,
            occurredAt: input.occurredAt,
          })
        : LoyaltyLedgerEntry.createReversalRefund({
            id: randomUUID(),
            customerId: customer.id,
            pointsReversed: pointsToReverse,
            balanceAfter: mutation.currentPoints,
            originalLedgerEntryId: original.id,
            originalOrderId: input.originalOrderId.trim(),
            idempotencyKey,
            programSnapshot: { ...original.programSnapshot },
            reason: input.reason,
            refundBusinessRef: input.refundBusinessRef,
            actor,
            occurredAt: input.occurredAt,
          });

    try {
      await this.ledger.append(entry);
    } catch (error) {
      if (isDuplicateKeyError(error)) {
        throw new ReversalIdempotentRaceError(idempotencyKey);
      }
      throw error;
    }

    return {
      customerId: customer.id,
      originalOrderId: input.originalOrderId.trim(),
      originalLedgerEntryId: original.id,
      pointsReversed: pointsToReverse,
      balanceAfter: mutation.currentPoints,
      ledgerEntryId: entry.id,
      operation,
      alreadyProcessed: false,
      skippedZeroEarn: false,
      processedAt: input.occurredAt.toISOString(),
    };
  }

  private resolveExisting(
    existing: LoyaltyLedgerEntry,
    original: LoyaltyLedgerEntry,
    operation: LoyaltyReversalOperation,
  ): LoyaltyReverseEarnResult {
    const expectedType = operation === 'VOID' ? 'REVERSAL_VOID' : 'REVERSAL_REFUND';
    if (existing.type !== expectedType) {
      throw new ValidationException('Idempotency key bentrok dengan tipe ledger lain', {
        code: 'LOYALTY_REVERSAL_IDEMPOTENCY_CONFLICT',
      });
    }
    if (
      existing.metadata.kind !== 'REVERSAL_REFUND' &&
      existing.metadata.kind !== 'REVERSAL_VOID'
    ) {
      throw new ValidationException('Metadata reversal tidak valid', {
        code: 'LOYALTY_REVERSAL_IDEMPOTENCY_CONFLICT',
      });
    }
    if (existing.metadata.originalLedgerEntryId !== original.id) {
      throw new ValidationException('Reversal tidak merujuk EARN_SALE yang sama', {
        code: 'LOYALTY_REVERSAL_IDEMPOTENCY_CONFLICT',
      });
    }

    return {
      customerId: existing.customerId,
      originalOrderId: existing.metadata.originalOrderId,
      originalLedgerEntryId: original.id,
      pointsReversed: existing.metadata.pointsReversed,
      balanceAfter: existing.balanceAfter,
      ledgerEntryId: existing.id,
      operation,
      alreadyProcessed: true,
      skippedZeroEarn: false,
      processedAt: existing.occurredAt.toISOString(),
    };
  }
}
