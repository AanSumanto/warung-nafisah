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
  readonly eligiblePaidAmount: number;
  readonly orderId: string;
  readonly paymentId?: string;
  readonly calculationVersion: string;
}

export interface LoyaltyLedgerEntryProps {
  readonly customerId: string;
  readonly type: LoyaltyLedgerType;
  readonly pointsDelta: number;
  readonly balanceAfter: number;
  readonly sourceType: LoyaltySourceType;
  readonly sourceId: string;
  readonly idempotencyKey: string;
  readonly programSnapshot: LoyaltyProgramSnapshot;
  readonly metadata: LoyaltyLedgerEarnMetadata;
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

  get metadata(): LoyaltyLedgerEarnMetadata {
    return this.props.metadata;
  }

  get actor(): LoyaltyLedgerActor {
    return this.props.actor;
  }

  get occurredAt(): Date {
    return this.props.occurredAt;
  }
}
