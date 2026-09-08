import { randomUUID } from 'node:crypto';
import {
  NotFoundException,
  ValidationException,
} from '../../core/exceptions/BaseException.js';
import { createIdentifier } from '../../domain/common/Identifier.js';
import { LoyaltyLedgerEntry } from '../../domain/loyalty/LoyaltyLedgerEntry.js';
import type { ICustomerRepository } from '../../domain/loyalty/ICustomerRepository.js';
import type { ILoyaltyLedgerRepository } from '../../domain/loyalty/ILoyaltyLedgerRepository.js';
import type { ILoyaltyProgramRepository } from '../../domain/loyalty/ILoyaltyProgramRepository.js';
import {
  MANUAL_ADJUSTMENT_ABS_MAX,
  buildManualAdjustmentIdempotencyKey,
} from '../../domain/loyalty/LoyaltyLedgerTypes.js';
import {
  DEFAULT_POINT_EARN_RATE,
  LOYALTY_PROGRAM_CODE,
} from '../../domain/loyalty/LoyaltyTypes.js';
import { getEnv } from '../../config/env.js';
import type { MongoUnitOfWork } from '../../infrastructure/persistence/MongoUnitOfWork.js';
import { withTransactionRetry } from '../../infrastructure/database/transaction-retry.js';

const REQUEST_ID_PATTERN = /^[A-Za-z0-9_-]{8,80}$/;

export interface ManualAdjustmentInput {
  readonly customerId: string;
  readonly pointsDelta: number;
  readonly reason: string;
  readonly note?: string;
  readonly requestId: string;
  readonly actorUserId: string;
}

export interface ManualAdjustmentResult {
  readonly adjustmentId: string;
  readonly customerId: string;
  readonly pointsDelta: number;
  readonly balanceAfter: number;
  readonly occurredAt: string;
  readonly alreadyProcessed: boolean;
}

export class ManualAdjustmentIdempotentRaceError extends Error {
  constructor(readonly idempotencyKey: string) {
    super('LOYALTY_MANUAL_ADJUSTMENT_IDEMPOTENT_RACE');
    this.name = 'ManualAdjustmentIdempotentRaceError';
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

/**
 * Owner-only MANUAL_ADJUSTMENT — delta only, append-only ledger.
 * Gate: LOYALTY_ADMIN_ADJUSTMENT_ENABLED (default false).
 */
export class LoyaltyManualAdjustmentService {
  constructor(
    private readonly customers: ICustomerRepository,
    private readonly ledger: ILoyaltyLedgerRepository,
    private readonly programs: ILoyaltyProgramRepository,
    private readonly unitOfWork: MongoUnitOfWork,
  ) {}

  assertGateEnabled(): void {
    if (!getEnv().LOYALTY_ADMIN_ADJUSTMENT_ENABLED) {
      throw new ValidationException('Penyesuaian poin admin belum diaktifkan', {
        code: 'LOYALTY_ADMIN_ADJUSTMENT_DISABLED',
      });
    }
  }

  async adjust(input: ManualAdjustmentInput): Promise<ManualAdjustmentResult> {
    this.assertGateEnabled();
    this.assertInput(input);
    const idempotencyKey = buildManualAdjustmentIdempotencyKey(input.requestId);

    const recover = async (error: unknown): Promise<ManualAdjustmentResult | null> => {
      const should =
        error instanceof ManualAdjustmentIdempotentRaceError ||
        isDuplicateKeyError(error) ||
        isAbortedTransactionError(error);
      if (!should) return null;
      const existing = await this.ledger.findByIdempotencyKey(idempotencyKey);
      if (!existing) return null;
      return this.resolveExisting(existing, input);
    };

    try {
      if (this.unitOfWork.getActiveSession()) {
        return await this.execute(input, idempotencyKey);
      }
      return await withTransactionRetry(
        async () => {
          try {
            return await this.unitOfWork.execute(async () =>
              this.execute(input, idempotencyKey),
            );
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

  private assertInput(input: ManualAdjustmentInput): void {
    if (!input.customerId?.trim()) {
      throw new ValidationException('customerId wajib', {
        code: 'LOYALTY_ADJUSTMENT_INVALID_INPUT',
      });
    }
    if (!Number.isInteger(input.pointsDelta) || input.pointsDelta === 0) {
      throw new ValidationException('pointsDelta harus bilangan bulat ≠ 0', {
        code: 'LOYALTY_ADJUSTMENT_INVALID_DELTA',
      });
    }
    if (Math.abs(input.pointsDelta) > MANUAL_ADJUSTMENT_ABS_MAX) {
      throw new ValidationException(
        `pointsDelta maksimal ±${MANUAL_ADJUSTMENT_ABS_MAX}`,
        { code: 'LOYALTY_ADJUSTMENT_DELTA_LIMIT' },
      );
    }
    if (!input.reason?.trim()) {
      throw new ValidationException('Alasan wajib diisi', {
        code: 'LOYALTY_ADJUSTMENT_REASON_REQUIRED',
      });
    }
    if (!REQUEST_ID_PATTERN.test(input.requestId?.trim() ?? '')) {
      throw new ValidationException(
        'requestId harus 8–80 karakter alfanumerik/_/-',
        { code: 'LOYALTY_ADJUSTMENT_INVALID_REQUEST_ID' },
      );
    }
    if (!input.actorUserId?.trim()) {
      throw new ValidationException('actor wajib', {
        code: 'LOYALTY_ADJUSTMENT_INVALID_INPUT',
      });
    }
  }

  private async execute(
    input: ManualAdjustmentInput,
    idempotencyKey: string,
  ): Promise<ManualAdjustmentResult> {
    const existing = await this.ledger.findByIdempotencyKey(idempotencyKey);
    if (existing) {
      return this.resolveExisting(existing, input);
    }

    const customer = await this.customers.findById(
      createIdentifier(input.customerId.trim()),
    );
    if (!customer) {
      throw new NotFoundException('Pelanggan tidak ditemukan', {
        code: 'LOYALTY_CUSTOMER_NOT_FOUND',
      });
    }
    if (!customer.isActive()) {
      throw new ValidationException('Pelanggan diblokir', {
        code: 'LOYALTY_CUSTOMER_BLOCKED',
      });
    }

    const program = await this.programs.findByProgramCode(LOYALTY_PROGRAM_CODE);
    const programSnapshot = {
      programCode: LOYALTY_PROGRAM_CODE,
      programVersion: program?.version ?? 1,
      pointEarnRate: program?.pointEarnRate ?? DEFAULT_POINT_EARN_RATE,
    };

    const occurredAt = new Date();
    let mutation;
    try {
      mutation = await this.customers.applyAdjustmentMutation(
        createIdentifier(customer.id),
        { pointsDelta: input.pointsDelta, occurredAt },
      );
    } catch (error) {
      if (error instanceof Error && error.message === 'CUSTOMER_ADJUSTMENT_MUTATION_FAILED') {
        throw new ValidationException('Pelanggan diblokir atau tidak ditemukan', {
          code: 'LOYALTY_CUSTOMER_BLOCKED',
        });
      }
      throw error;
    }

    const entry = LoyaltyLedgerEntry.createManualAdjustment({
      id: randomUUID(),
      customerId: customer.id,
      pointsDelta: input.pointsDelta,
      balanceAfter: mutation.currentPoints,
      idempotencyKey,
      programSnapshot,
      reason: input.reason.trim(),
      note: input.note,
      requestId: input.requestId.trim(),
      actor: { type: 'USER', userId: input.actorUserId.trim() },
      occurredAt,
    });

    try {
      await this.ledger.append(entry);
    } catch (error) {
      if (isDuplicateKeyError(error)) {
        throw new ManualAdjustmentIdempotentRaceError(idempotencyKey);
      }
      throw error;
    }

    return {
      adjustmentId: entry.id,
      customerId: customer.id,
      pointsDelta: entry.pointsDelta,
      balanceAfter: entry.balanceAfter,
      occurredAt: entry.occurredAt.toISOString(),
      alreadyProcessed: false,
    };
  }

  private resolveExisting(
    existing: LoyaltyLedgerEntry,
    input: ManualAdjustmentInput,
  ): ManualAdjustmentResult {
    if (existing.type !== 'MANUAL_ADJUSTMENT') {
      throw new ValidationException('requestId bentrok dengan tipe ledger lain', {
        code: 'LOYALTY_ADJUSTMENT_IDEMPOTENCY_CONFLICT',
      });
    }
    if (existing.customerId !== input.customerId.trim()) {
      throw new ValidationException('requestId sudah dipakai pelanggan lain', {
        code: 'LOYALTY_ADJUSTMENT_IDEMPOTENCY_CONFLICT',
      });
    }
    return {
      adjustmentId: existing.id,
      customerId: existing.customerId,
      pointsDelta: existing.pointsDelta,
      balanceAfter: existing.balanceAfter,
      occurredAt: existing.occurredAt.toISOString(),
      alreadyProcessed: true,
    };
  }
}
