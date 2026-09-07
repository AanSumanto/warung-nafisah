import { BaseEntity } from '../base/BaseEntity.js';
import type { Identifier } from '../common/Identifier.js';
import { createIdentifier } from '../common/Identifier.js';
import { DomainError } from '../errors/DomainError.js';
import {
  DEFAULT_POINT_EARN_RATE,
  LOYALTY_PROGRAM_CODE,
  LOYALTY_PROGRAM_NAME,
} from './LoyaltyTypes.js';

export interface LoyaltyProgramProps extends Record<string, unknown> {
  programCode: string;
  programName: string;
  enabled: boolean;
  pointEarnRate: number;
  version: number;
  effectiveFrom: Date;
  updatedBy: string;
}

export interface CreateLoyaltyProgramInput {
  readonly id: string;
  readonly programCode?: string;
  readonly programName?: string;
  readonly pointEarnRate?: number;
  readonly updatedBy: string;
  readonly effectiveFrom?: Date;
}

export class LoyaltyProgram extends BaseEntity<LoyaltyProgramProps> {
  private constructor(
    props: LoyaltyProgramProps,
    id: Identifier,
    createdAt: Date,
    updatedAt: Date,
  ) {
    super(props, id, createdAt, updatedAt);
  }

  /**
   * Creates baseline program. Always starts disabled — earning requires LOYALTY-03/04.
   */
  static createBaseline(input: CreateLoyaltyProgramInput): LoyaltyProgram {
    if (!input.updatedBy?.trim()) {
      throw DomainError.invalidArgument('updatedBy is required', 'updatedBy');
    }

    const programCode = (input.programCode ?? LOYALTY_PROGRAM_CODE).trim().toUpperCase();
    if (!/^[A-Z][A-Z0-9_]{2,31}$/.test(programCode)) {
      throw DomainError.invalidArgument('programCode tidak valid', 'programCode');
    }

    const programName = (input.programName ?? LOYALTY_PROGRAM_NAME).trim();
    if (!programName || programName.length > 120) {
      throw DomainError.invalidArgument('programName tidak valid', 'programName');
    }

    const pointEarnRate = input.pointEarnRate ?? DEFAULT_POINT_EARN_RATE;
    LoyaltyProgram.assertPointEarnRate(pointEarnRate);

    const now = new Date();
    return new LoyaltyProgram(
      {
        programCode,
        programName,
        enabled: false,
        pointEarnRate,
        version: 1,
        effectiveFrom: input.effectiveFrom ?? now,
        updatedBy: input.updatedBy.trim(),
      },
      createIdentifier(input.id),
      now,
      now,
    );
  }

  static reconstitute(
    id: string,
    props: LoyaltyProgramProps,
    createdAt: Date,
    updatedAt: Date,
  ): LoyaltyProgram {
    return new LoyaltyProgram(props, createIdentifier(id), createdAt, updatedAt);
  }

  private static assertPointEarnRate(value: number): void {
    if (!Number.isInteger(value) || value < 1) {
      throw DomainError.invalidArgument(
        'pointEarnRate harus bilangan bulat positif (Rupiah per 1 poin)',
        'pointEarnRate',
      );
    }
  }

  get programCode(): string {
    return this.props.programCode;
  }

  get programName(): string {
    return this.props.programName;
  }

  get enabled(): boolean {
    return this.props.enabled;
  }

  get pointEarnRate(): number {
    return this.props.pointEarnRate;
  }

  get version(): number {
    return this.props.version;
  }

  get effectiveFrom(): Date {
    return this.props.effectiveFrom;
  }

  get updatedBy(): string {
    return this.props.updatedBy;
  }

  /**
   * Update earn rate / display name. Increments version on economic change.
   * Does NOT enable the program — activation is blocked until LOYALTY-03/04.
   */
  updateConfig(input: {
    pointEarnRate?: number;
    programName?: string;
    updatedBy: string;
  }): LoyaltyProgram {
    if (!input.updatedBy?.trim()) {
      throw DomainError.invalidArgument('updatedBy is required', 'updatedBy');
    }

    let pointEarnRate = this.props.pointEarnRate;
    let programName = this.props.programName;
    let version = this.props.version;
    let effectiveFrom = this.props.effectiveFrom;
    let changed = false;

    if (input.pointEarnRate !== undefined) {
      LoyaltyProgram.assertPointEarnRate(input.pointEarnRate);
      if (input.pointEarnRate !== this.props.pointEarnRate) {
        pointEarnRate = input.pointEarnRate;
        version += 1;
        effectiveFrom = new Date();
        changed = true;
      }
    }

    if (input.programName !== undefined) {
      const trimmed = input.programName.trim();
      if (!trimmed || trimmed.length > 120) {
        throw DomainError.invalidArgument('programName tidak valid', 'programName');
      }
      if (trimmed !== this.props.programName) {
        programName = trimmed;
        changed = true;
      }
    }

    if (!changed) {
      return this;
    }

    const now = new Date();
    return new LoyaltyProgram(
      {
        ...this.props,
        pointEarnRate,
        programName,
        version,
        effectiveFrom,
        updatedBy: input.updatedBy.trim(),
        // enabled intentionally unchanged — never flipped true here
        enabled: this.props.enabled,
      },
      this.id,
      this.createdAt,
      now,
    );
  }
}
