import { DomainError } from '../errors/DomainError.js';
import {
  LOYALTY_LEDGER_TYPES,
  type LoyaltyLedgerType,
  type LoyaltySourceType,
} from './LoyaltyLedgerTypes.js';

export interface LoyaltyProgramSnapshot {
  readonly programCode: string;
  readonly programVersion: number;
  readonly pointEarnRate: number;
}

export interface LoyaltyLedgerActor {
  readonly type: 'SYSTEM' | 'USER';
  readonly userId?: string;
}

export interface LoyaltyLedgerEarnMetadata {
  readonly kind: 'EARN_SALE';
  readonly eligiblePaidAmount: number;
  readonly orderId: string;
  readonly paymentId?: string;
  readonly calculationVersion: string;
}

export interface LoyaltyLedgerRedeemMetadata {
  readonly kind: 'REDEEM_REWARD';
  readonly orderId: string;
  readonly rewardCode: string;
  readonly rewardName: string;
  readonly pointsRequired: number;
  readonly menuKode: string;
  readonly rewardHppSnapshot: number;
}

export interface LoyaltyLedgerReversalMetadata {
  readonly kind: 'REVERSAL_REFUND' | 'REVERSAL_VOID';
  readonly originalLedgerEntryId: string;
  readonly originalOrderId: string;
  readonly pointsReversed: number;
  readonly reason?: string;
  readonly refundBusinessRef?: string;
  readonly voidBusinessRef?: string;
}

export interface LoyaltyLedgerManualMetadata {
  readonly kind: 'MANUAL_ADJUSTMENT';
  readonly reason: string;
  readonly note?: string;
  readonly requestId: string;
}

export type LoyaltyLedgerMetadata =
  | LoyaltyLedgerEarnMetadata
  | LoyaltyLedgerRedeemMetadata
  | LoyaltyLedgerReversalMetadata
  | LoyaltyLedgerManualMetadata;

export interface LoyaltyLedgerEntryProps {
  readonly customerId: string;
  readonly type: LoyaltyLedgerType;
  readonly pointsDelta: number;
  readonly balanceAfter: number;
  readonly sourceType: LoyaltySourceType;
  readonly sourceId: string;
  readonly idempotencyKey: string;
  readonly programSnapshot: LoyaltyProgramSnapshot;
  readonly metadata: LoyaltyLedgerMetadata;
  readonly actor: LoyaltyLedgerActor;
  readonly occurredAt: Date;
}

/**
 * Immutable loyalty ledger entry.
 * No update methods — corrections use compensating entries later.
 */
export class LoyaltyLedgerEntry {
  private constructor(
    readonly id: string,
    readonly props: LoyaltyLedgerEntryProps,
    readonly createdAt: Date,
  ) {}

  static createEarnSale(input: {
    readonly id: string;
    readonly customerId: string;
    readonly pointsDelta: number;
    readonly balanceAfter: number;
    readonly sourceOrderId: string;
    readonly idempotencyKey: string;
    readonly programSnapshot: LoyaltyProgramSnapshot;
    readonly eligiblePaidAmount: number;
    readonly paymentId?: string;
    readonly actor: LoyaltyLedgerActor;
    readonly occurredAt: Date;
    readonly createdAt?: Date;
  }): LoyaltyLedgerEntry {
    if (!input.customerId?.trim()) {
      throw DomainError.invalidArgument('customerId is required', 'customerId');
    }
    if (!Number.isInteger(input.pointsDelta) || input.pointsDelta < 0) {
      throw DomainError.invalidArgument('EARN_SALE pointsDelta must be integer >= 0', 'pointsDelta');
    }
    if (!Number.isInteger(input.balanceAfter)) {
      throw DomainError.invalidArgument('balanceAfter must be an integer', 'balanceAfter');
    }
    if (!input.sourceOrderId?.trim()) {
      throw DomainError.invalidArgument('sourceOrderId is required', 'sourceOrderId');
    }
    if (!input.idempotencyKey?.trim() || input.idempotencyKey.length > 200) {
      throw DomainError.invalidArgument('idempotencyKey is invalid', 'idempotencyKey');
    }
    if (!(input.occurredAt instanceof Date) || Number.isNaN(input.occurredAt.getTime())) {
      throw DomainError.invalidArgument('occurredAt is invalid', 'occurredAt');
    }
    if (!Number.isInteger(input.eligiblePaidAmount) || input.eligiblePaidAmount < 0) {
      throw DomainError.invalidArgument(
        'eligiblePaidAmount must be integer >= 0',
        'eligiblePaidAmount',
      );
    }
    LoyaltyLedgerEntry.assertProgramSnapshot(input.programSnapshot);

    return new LoyaltyLedgerEntry(
      input.id,
      {
        customerId: input.customerId.trim(),
        type: 'EARN_SALE',
        pointsDelta: input.pointsDelta,
        balanceAfter: input.balanceAfter,
        sourceType: 'SALE',
        sourceId: input.sourceOrderId.trim(),
        idempotencyKey: input.idempotencyKey.trim(),
        programSnapshot: { ...input.programSnapshot },
        metadata: {
          kind: 'EARN_SALE',
          eligiblePaidAmount: input.eligiblePaidAmount,
          orderId: input.sourceOrderId.trim(),
          paymentId: input.paymentId,
          calculationVersion: 'v1',
        },
        actor: { ...input.actor },
        occurredAt: input.occurredAt,
      },
      input.createdAt ?? new Date(),
    );
  }

  static createRedeemReward(input: {
    readonly id: string;
    readonly customerId: string;
    readonly pointsRequired: number;
    readonly balanceAfter: number;
    readonly sourceOrderId: string;
    readonly idempotencyKey: string;
    readonly programSnapshot: LoyaltyProgramSnapshot;
    readonly rewardCode: string;
    readonly rewardName: string;
    readonly menuKode: string;
    readonly rewardHppSnapshot: number;
    readonly actor: LoyaltyLedgerActor;
    readonly occurredAt: Date;
    readonly createdAt?: Date;
  }): LoyaltyLedgerEntry {
    if (!input.customerId?.trim()) {
      throw DomainError.invalidArgument('customerId is required', 'customerId');
    }
    if (!Number.isInteger(input.pointsRequired) || input.pointsRequired < 1) {
      throw DomainError.invalidArgument('pointsRequired must be integer >= 1', 'pointsRequired');
    }
    if (!Number.isInteger(input.balanceAfter) || input.balanceAfter < 0) {
      throw DomainError.invalidArgument('balanceAfter must be integer >= 0', 'balanceAfter');
    }
    if (!input.sourceOrderId?.trim()) {
      throw DomainError.invalidArgument('sourceOrderId is required', 'sourceOrderId');
    }
    if (!input.idempotencyKey?.trim() || input.idempotencyKey.length > 200) {
      throw DomainError.invalidArgument('idempotencyKey is invalid', 'idempotencyKey');
    }
    if (!(input.occurredAt instanceof Date) || Number.isNaN(input.occurredAt.getTime())) {
      throw DomainError.invalidArgument('occurredAt is invalid', 'occurredAt');
    }
    if (!input.rewardCode?.trim()) {
      throw DomainError.invalidArgument('rewardCode is required', 'rewardCode');
    }
    if (!input.rewardName?.trim()) {
      throw DomainError.invalidArgument('rewardName is required', 'rewardName');
    }
    if (!input.menuKode?.trim()) {
      throw DomainError.invalidArgument('menuKode is required', 'menuKode');
    }
    if (!Number.isInteger(input.rewardHppSnapshot) || input.rewardHppSnapshot < 0) {
      throw DomainError.invalidArgument('rewardHppSnapshot invalid', 'rewardHppSnapshot');
    }
    LoyaltyLedgerEntry.assertProgramSnapshot(input.programSnapshot);

    return new LoyaltyLedgerEntry(
      input.id,
      {
        customerId: input.customerId.trim(),
        type: 'REDEEM_REWARD',
        pointsDelta: -input.pointsRequired,
        balanceAfter: input.balanceAfter,
        sourceType: 'REWARD_REDEMPTION',
        sourceId: input.sourceOrderId.trim(),
        idempotencyKey: input.idempotencyKey.trim(),
        programSnapshot: { ...input.programSnapshot },
        metadata: {
          kind: 'REDEEM_REWARD',
          orderId: input.sourceOrderId.trim(),
          rewardCode: input.rewardCode.trim().toUpperCase(),
          rewardName: input.rewardName.trim(),
          pointsRequired: input.pointsRequired,
          menuKode: input.menuKode.trim().toUpperCase(),
          rewardHppSnapshot: input.rewardHppSnapshot,
        },
        actor: { ...input.actor },
        occurredAt: input.occurredAt,
      },
      input.createdAt ?? new Date(),
    );
  }

  /**
   * Owner-only compensating / correction entry.
   * pointsDelta is signed (≠ 0). balanceAfter may be negative.
   */
  static createManualAdjustment(input: {
    readonly id: string;
    readonly customerId: string;
    readonly pointsDelta: number;
    readonly balanceAfter: number;
    readonly idempotencyKey: string;
    readonly programSnapshot: LoyaltyProgramSnapshot;
    readonly reason: string;
    readonly note?: string;
    readonly requestId: string;
    readonly actor: LoyaltyLedgerActor;
    readonly occurredAt: Date;
    readonly createdAt?: Date;
  }): LoyaltyLedgerEntry {
    if (!input.customerId?.trim()) {
      throw DomainError.invalidArgument('customerId is required', 'customerId');
    }
    if (!Number.isInteger(input.pointsDelta) || input.pointsDelta === 0) {
      throw DomainError.invalidArgument(
        'MANUAL_ADJUSTMENT pointsDelta must be non-zero integer',
        'pointsDelta',
      );
    }
    if (!Number.isInteger(input.balanceAfter)) {
      throw DomainError.invalidArgument('balanceAfter must be an integer', 'balanceAfter');
    }
    const reason = input.reason?.trim();
    if (!reason || reason.length > 200) {
      throw DomainError.invalidArgument('reason is required (max 200)', 'reason');
    }
    const requestId = input.requestId?.trim();
    if (!requestId || requestId.length > 80) {
      throw DomainError.invalidArgument('requestId is invalid', 'requestId');
    }
    if (!input.idempotencyKey?.trim() || input.idempotencyKey.length > 200) {
      throw DomainError.invalidArgument('idempotencyKey is invalid', 'idempotencyKey');
    }
    if (!(input.occurredAt instanceof Date) || Number.isNaN(input.occurredAt.getTime())) {
      throw DomainError.invalidArgument('occurredAt is invalid', 'occurredAt');
    }
    if (input.actor.type !== 'USER' || !input.actor.userId?.trim()) {
      throw DomainError.invalidArgument('MANUAL_ADJUSTMENT requires USER actor', 'actor');
    }
    const note = input.note?.trim();
    if (note !== undefined && note.length > 500) {
      throw DomainError.invalidArgument('note max 500 characters', 'note');
    }
    LoyaltyLedgerEntry.assertProgramSnapshot(input.programSnapshot);

    return new LoyaltyLedgerEntry(
      input.id,
      {
        customerId: input.customerId.trim(),
        type: 'MANUAL_ADJUSTMENT',
        pointsDelta: input.pointsDelta,
        balanceAfter: input.balanceAfter,
        sourceType: 'MANUAL',
        sourceId: requestId,
        idempotencyKey: input.idempotencyKey.trim(),
        programSnapshot: { ...input.programSnapshot },
        metadata: {
          kind: 'MANUAL_ADJUSTMENT',
          reason,
          note: note || undefined,
          requestId,
        },
        actor: { type: 'USER', userId: input.actor.userId.trim() },
        occurredAt: input.occurredAt,
      },
      input.createdAt ?? new Date(),
    );
  }

  /**
   * Compensating entry for a prior EARN_SALE after monetary refund.
   * pointsDelta is always -originalEarnPoints (exact historical snapshot).
   * balanceAfter may be negative (locked V1 policy).
   */
  static createReversalRefund(input: {
    readonly id: string;
    readonly customerId: string;
    readonly pointsReversed: number;
    readonly balanceAfter: number;
    readonly originalLedgerEntryId: string;
    readonly originalOrderId: string;
    readonly idempotencyKey: string;
    readonly programSnapshot: LoyaltyProgramSnapshot;
    readonly reason?: string;
    readonly refundBusinessRef?: string;
    readonly actor: LoyaltyLedgerActor;
    readonly occurredAt: Date;
    readonly createdAt?: Date;
  }): LoyaltyLedgerEntry {
    return LoyaltyLedgerEntry.createReversal({
      ...input,
      type: 'REVERSAL_REFUND',
      sourceType: 'REFUND',
      sourceId: input.refundBusinessRef?.trim() || input.originalOrderId.trim(),
      metadataKind: 'REVERSAL_REFUND',
    });
  }

  /**
   * Compensating entry for a prior EARN_SALE after void (when platform supports void).
   */
  static createReversalVoid(input: {
    readonly id: string;
    readonly customerId: string;
    readonly pointsReversed: number;
    readonly balanceAfter: number;
    readonly originalLedgerEntryId: string;
    readonly originalOrderId: string;
    readonly idempotencyKey: string;
    readonly programSnapshot: LoyaltyProgramSnapshot;
    readonly reason?: string;
    readonly voidBusinessRef?: string;
    readonly actor: LoyaltyLedgerActor;
    readonly occurredAt: Date;
    readonly createdAt?: Date;
  }): LoyaltyLedgerEntry {
    return LoyaltyLedgerEntry.createReversal({
      ...input,
      type: 'REVERSAL_VOID',
      sourceType: 'VOID',
      sourceId: input.voidBusinessRef?.trim() || input.originalOrderId.trim(),
      metadataKind: 'REVERSAL_VOID',
      refundBusinessRef: undefined,
      voidBusinessRef: input.voidBusinessRef,
    });
  }

  private static createReversal(input: {
    readonly id: string;
    readonly customerId: string;
    readonly pointsReversed: number;
    readonly balanceAfter: number;
    readonly originalLedgerEntryId: string;
    readonly originalOrderId: string;
    readonly idempotencyKey: string;
    readonly programSnapshot: LoyaltyProgramSnapshot;
    readonly reason?: string;
    readonly refundBusinessRef?: string;
    readonly voidBusinessRef?: string;
    readonly actor: LoyaltyLedgerActor;
    readonly occurredAt: Date;
    readonly createdAt?: Date;
    readonly type: 'REVERSAL_REFUND' | 'REVERSAL_VOID';
    readonly sourceType: 'REFUND' | 'VOID';
    readonly sourceId: string;
    readonly metadataKind: 'REVERSAL_REFUND' | 'REVERSAL_VOID';
  }): LoyaltyLedgerEntry {
    if (!input.customerId?.trim()) {
      throw DomainError.invalidArgument('customerId is required', 'customerId');
    }
    if (!Number.isInteger(input.pointsReversed) || input.pointsReversed < 1) {
      throw DomainError.invalidArgument(
        'pointsReversed must be integer >= 1',
        'pointsReversed',
      );
    }
    if (!Number.isInteger(input.balanceAfter)) {
      throw DomainError.invalidArgument('balanceAfter must be an integer', 'balanceAfter');
    }
    if (!input.originalLedgerEntryId?.trim()) {
      throw DomainError.invalidArgument(
        'originalLedgerEntryId is required',
        'originalLedgerEntryId',
      );
    }
    if (!input.originalOrderId?.trim()) {
      throw DomainError.invalidArgument('originalOrderId is required', 'originalOrderId');
    }
    if (!input.idempotencyKey?.trim() || input.idempotencyKey.length > 200) {
      throw DomainError.invalidArgument('idempotencyKey is invalid', 'idempotencyKey');
    }
    if (!(input.occurredAt instanceof Date) || Number.isNaN(input.occurredAt.getTime())) {
      throw DomainError.invalidArgument('occurredAt is invalid', 'occurredAt');
    }
    if (!input.sourceId?.trim()) {
      throw DomainError.invalidArgument('sourceId is required', 'sourceId');
    }
    LoyaltyLedgerEntry.assertProgramSnapshot(input.programSnapshot);

    const metadata: LoyaltyLedgerReversalMetadata = {
      kind: input.metadataKind,
      originalLedgerEntryId: input.originalLedgerEntryId.trim(),
      originalOrderId: input.originalOrderId.trim(),
      pointsReversed: input.pointsReversed,
      reason: input.reason?.trim() || undefined,
      refundBusinessRef: input.refundBusinessRef?.trim() || undefined,
      voidBusinessRef: input.voidBusinessRef?.trim() || undefined,
    };

    return new LoyaltyLedgerEntry(
      input.id,
      {
        customerId: input.customerId.trim(),
        type: input.type,
        pointsDelta: -input.pointsReversed,
        balanceAfter: input.balanceAfter,
        sourceType: input.sourceType,
        sourceId: input.sourceId.trim(),
        idempotencyKey: input.idempotencyKey.trim(),
        programSnapshot: { ...input.programSnapshot },
        metadata,
        actor: { ...input.actor },
        occurredAt: input.occurredAt,
      },
      input.createdAt ?? new Date(),
    );
  }

  static reconstitute(
    id: string,
    props: LoyaltyLedgerEntryProps,
    createdAt: Date,
  ): LoyaltyLedgerEntry {
    if (!(LOYALTY_LEDGER_TYPES as readonly string[]).includes(props.type)) {
      throw DomainError.invalidArgument('Invalid ledger type', 'type');
    }
    return new LoyaltyLedgerEntry(id, props, createdAt);
  }

  private static assertProgramSnapshot(snapshot: LoyaltyProgramSnapshot): void {
    if (!snapshot.programCode?.trim()) {
      throw DomainError.invalidArgument('programCode required', 'programSnapshot');
    }
    if (!Number.isInteger(snapshot.programVersion) || snapshot.programVersion < 1) {
      throw DomainError.invalidArgument('programVersion invalid', 'programSnapshot');
    }
    if (!Number.isInteger(snapshot.pointEarnRate) || snapshot.pointEarnRate < 1) {
      throw DomainError.invalidArgument('pointEarnRate invalid', 'programSnapshot');
    }
  }

  get customerId(): string {
    return this.props.customerId;
  }

  get type(): LoyaltyLedgerType {
    return this.props.type;
  }

  get pointsDelta(): number {
    return this.props.pointsDelta;
  }

  get balanceAfter(): number {
    return this.props.balanceAfter;
  }

  get sourceType(): LoyaltySourceType {
    return this.props.sourceType;
  }

  get sourceId(): string {
    return this.props.sourceId;
  }

  get idempotencyKey(): string {
    return this.props.idempotencyKey;
  }

  get programSnapshot(): LoyaltyProgramSnapshot {
    return this.props.programSnapshot;
  }

  get metadata(): LoyaltyLedgerMetadata {
    return this.props.metadata;
  }

  get actor(): LoyaltyLedgerActor {
    return this.props.actor;
  }

  get occurredAt(): Date {
    return this.props.occurredAt;
  }
}
