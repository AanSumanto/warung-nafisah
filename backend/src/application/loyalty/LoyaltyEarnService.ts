import { randomUUID } from 'node:crypto';
import {
  NotFoundException,
  ValidationException,
} from '../../core/exceptions/BaseException.js';
import { createIdentifier } from '../../domain/common/Identifier.js';
import { calculateEarnedPoints } from '../../domain/loyalty/calculateEarnedPoints.js';
import { LoyaltyLedgerEntry } from '../../domain/loyalty/LoyaltyLedgerEntry.js';
import type { ICustomerRepository } from '../../domain/loyalty/ICustomerRepository.js';
import type { ILoyaltyLedgerRepository } from '../../domain/loyalty/ILoyaltyLedgerRepository.js';
import type { ILoyaltyProgramRepository } from '../../domain/loyalty/ILoyaltyProgramRepository.js';
import { buildEarnSaleIdempotencyKey } from '../../domain/loyalty/LoyaltyLedgerTypes.js';
import { LOYALTY_PROGRAM_CODE } from '../../domain/loyalty/LoyaltyTypes.js';
import type { MongoUnitOfWork } from '../../infrastructure/persistence/MongoUnitOfWork.js';
import { withTransactionRetry } from '../../infrastructure/database/transaction-retry.js';

export interface LoyaltyEarnInput {
  readonly customerId: string;
  readonly orderId: string;
  readonly eligiblePaidAmount: number;
  readonly occurredAt: Date;
  readonly actorUserId?: string;
  readonly paymentId?: string;
  readonly programCode?: string;
}

export interface LoyaltyEarnResult {
  readonly customerId: string;
  readonly sourceOrderId: string;
  readonly eligiblePaidAmount: number;
  readonly pointsEarned: number;
  readonly balanceAfter: number;
  readonly programCode: string;
  readonly programVersion: number;
  readonly pointEarnRate: number;
  readonly processedAt: string;
  readonly alreadyProcessed: boolean;
  readonly ledgerEntryId: string;
}

/** Unique-key race lost on ledger append; transaction must roll back. */
export class EarnIdempotentRaceError extends Error {
  constructor(readonly idempotencyKey: string) {
    super('LOYALTY_EARN_IDEMPOTENT_RACE');
    this.name = 'EarnIdempotentRaceError';
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

function assertEarnInput(input: LoyaltyEarnInput): void {
  if (!input.customerId?.trim()) {
    throw new ValidationException('customerId wajib diisi', {
      code: 'LOYALTY_CUSTOMER_NOT_FOUND',
    });
  }
  if (!input.orderId?.trim()) {
    throw new ValidationException('orderId wajib diisi', {
      code: 'LOYALTY_INVALID_ELIGIBLE_AMOUNT',
    });
  }
  if (!Number.isInteger(input.eligiblePaidAmount) || input.eligiblePaidAmount < 0) {
    throw new ValidationException('eligiblePaidAmount harus bilangan bulat Rupiah >= 0', {
      code: 'LOYALTY_INVALID_ELIGIBLE_AMOUNT',
    });
  }
  if (!(input.occurredAt instanceof Date) || Number.isNaN(input.occurredAt.getTime())) {
    throw new ValidationException('occurredAt tidak valid', {
      code: 'LOYALTY_INVALID_ELIGIBLE_AMOUNT',
    });
  }
}

/**
 * Internal earn capability — NO public HTTP route.
 *
 * Transaction boundary (LOYALTY-04 ready):
 * - If UnitOfWork already has an active session, runs inside it (no nested txn).
 * - Otherwise opens its own Mongo transaction with WriteConflict retry.
 *
 * Concurrency:
 * - Different orders / same customer: $inc + txn WriteConflict retry.
 * - Same order: unique idempotencyKey; loser rolls back $inc and returns winner.
 */
export class LoyaltyEarnService {
  constructor(
    private readonly customers: ICustomerRepository,
    private readonly ledger: ILoyaltyLedgerRepository,
    private readonly programs: ILoyaltyProgramRepository,
    private readonly unitOfWork: MongoUnitOfWork,
  ) {}

  async earn(input: LoyaltyEarnInput): Promise<LoyaltyEarnResult> {
    assertEarnInput(input);
    const idempotencyKey = buildEarnSaleIdempotencyKey(input.orderId);

    const recover = async (error: unknown): Promise<LoyaltyEarnResult | null> => {
      const shouldRecover =
        error instanceof EarnIdempotentRaceError ||
        isDuplicateKeyError(error) ||
        isAbortedTransactionError(error);
      if (!shouldRecover) return null;

      const existing = await this.ledger.findByIdempotencyKey(idempotencyKey);
      if (!existing) return null;
      return this.resolveExisting(existing, input);
    };

    try {
      if (this.unitOfWork.getActiveSession()) {
        return await this.executeEarn(input);
      }
      return await withTransactionRetry(
        async () => {
          try {
            return await this.unitOfWork.execute(async () => this.executeEarn(input));
          } catch (error) {
            const recovered = await recover(error);
            if (recovered) return recovered;
            throw error;
          }
        },
        { maxAttempts: 12, baseDelayMs: 25 },
      );
    } catch (error) {
      const recovered = await recover(error);
      if (recovered) return recovered;
      throw error;
    }
  }

  private async executeEarn(input: LoyaltyEarnInput): Promise<LoyaltyEarnResult> {
    const programCode = input.programCode ?? LOYALTY_PROGRAM_CODE;
    const idempotencyKey = buildEarnSaleIdempotencyKey(input.orderId);

    const existing = await this.ledger.findByIdempotencyKey(idempotencyKey);
    if (existing) {
      return this.resolveExisting(existing, input);
    }

    const program = await this.programs.findByProgramCode(programCode);
    if (!program) {
      throw new NotFoundException('Program loyalty tidak ditemukan', {
        code: 'LOYALTY_PROGRAM_NOT_FOUND',
      });
    }
    if (!program.enabled) {
      throw new ValidationException('Program loyalty belum diaktifkan', {
        code: 'LOYALTY_PROGRAM_DISABLED',
      });
    }

    const customer = await this.customers.findById(createIdentifier(input.customerId.trim()));
    if (!customer) {
      throw new NotFoundException('Pelanggan tidak ditemukan', {
        code: 'LOYALTY_CUSTOMER_NOT_FOUND',
      });
    }
    if (customer.status === 'blocked') {
      throw new ValidationException('Pelanggan diblokir; tidak dapat menambah poin', {
        code: 'LOYALTY_CUSTOMER_BLOCKED',
      });
    }

    let pointsEarned: number;
    try {
      pointsEarned = calculateEarnedPoints({
        eligiblePaidAmount: input.eligiblePaidAmount,
        pointEarnRate: program.pointEarnRate,
      });
    } catch (error) {
      if (error instanceof Error) {
        throw new ValidationException(error.message, {
          code: 'LOYALTY_INVALID_ELIGIBLE_AMOUNT',
        });
      }
      throw error;
    }

    // Atomic $inc first → authoritative balanceAfter (safe under concurrent different orders)
    let mutation;
    try {
      mutation = await this.customers.applyEarnMutation(createIdentifier(customer.id), {
        pointsDelta: pointsEarned,
        eligiblePaidAmount: input.eligiblePaidAmount,
        occurredAt: input.occurredAt,
      });
    } catch (error) {
      if (error instanceof Error && error.message === 'CUSTOMER_EARN_MUTATION_FAILED') {
        throw new ValidationException('Pelanggan diblokir atau tidak ditemukan', {
          code: 'LOYALTY_CUSTOMER_BLOCKED',
        });
      }
      throw error;
    }

    const entry = LoyaltyLedgerEntry.createEarnSale({
      id: randomUUID(),
      customerId: customer.id,
      pointsDelta: pointsEarned,
      balanceAfter: mutation.currentPoints,
      sourceOrderId: input.orderId.trim(),
      idempotencyKey,
      programSnapshot: {
        programCode: program.programCode,
        programVersion: program.version,
        pointEarnRate: program.pointEarnRate,
      },
      eligiblePaidAmount: input.eligiblePaidAmount,
      paymentId: input.paymentId,
      actor: input.actorUserId
        ? { type: 'USER', userId: input.actorUserId }
        : { type: 'SYSTEM' },
      occurredAt: input.occurredAt,
    });

    try {
      await this.ledger.append(entry);
    } catch (error) {
      if (isDuplicateKeyError(error)) {
        // Same-order race: peer committed ledger. Abort our $inc via txn rollback.
        throw new EarnIdempotentRaceError(idempotencyKey);
      }
      throw error;
    }

    return {
      customerId: customer.id,
      sourceOrderId: input.orderId.trim(),
      eligiblePaidAmount: input.eligiblePaidAmount,
      pointsEarned,
      balanceAfter: mutation.currentPoints,
      programCode: program.programCode,
      programVersion: program.version,
      pointEarnRate: program.pointEarnRate,
      processedAt: entry.createdAt.toISOString(),
      alreadyProcessed: false,
      ledgerEntryId: entry.id,
    };
  }

  private resolveExisting(
    existing: LoyaltyLedgerEntry,
    input: LoyaltyEarnInput,
  ): LoyaltyEarnResult {
    if (existing.customerId !== input.customerId.trim()) {
      throw new ValidationException('Order sudah diproses untuk pelanggan berbeda', {
        code: 'LOYALTY_EARN_CONFLICT',
      });
    }
    if (existing.metadata.kind !== 'EARN_SALE') {
      throw new ValidationException('Order sudah diproses dengan tipe ledger berbeda', {
        code: 'LOYALTY_EARN_CONFLICT',
      });
    }
    if (existing.metadata.eligiblePaidAmount !== input.eligiblePaidAmount) {
      throw new ValidationException(
        'Order sudah diproses dengan eligiblePaidAmount berbeda',
        { code: 'LOYALTY_EARN_CONFLICT' },
      );
    }

    return {
      customerId: existing.customerId,
      sourceOrderId: existing.sourceId,
      eligiblePaidAmount: existing.metadata.eligiblePaidAmount,
      pointsEarned: existing.pointsDelta,
      balanceAfter: existing.balanceAfter,
      programCode: existing.programSnapshot.programCode,
      programVersion: existing.programSnapshot.programVersion,
      pointEarnRate: existing.programSnapshot.pointEarnRate,
      processedAt: existing.createdAt.toISOString(),
      alreadyProcessed: true,
      ledgerEntryId: existing.id,
    };
  }

  async reconcileBalance(customerId: string): Promise<{
    cachedPoints: number;
    ledgerSum: number;
    matches: boolean;
  }> {
    const customer = await this.customers.findById(createIdentifier(customerId));
    if (!customer) {
      throw new NotFoundException('Pelanggan tidak ditemukan', {
        code: 'LOYALTY_CUSTOMER_NOT_FOUND',
      });
    }
    const ledgerSum = await this.ledger.sumPointsDelta(customerId);
    return {
      cachedPoints: customer.currentPoints,
      ledgerSum,
      matches: customer.currentPoints === ledgerSum,
    };
  }
}
