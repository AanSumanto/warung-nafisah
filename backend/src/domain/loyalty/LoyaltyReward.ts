import { BaseEntity } from '../base/BaseEntity.js';
import type { Identifier } from '../common/Identifier.js';
import { createIdentifier } from '../common/Identifier.js';
import { DomainError } from '../errors/DomainError.js';
import { REWARD_STATUSES, type RewardStatus } from './LoyaltyTypes.js';

const REWARD_CODE_PATTERN = /^REWARD_[A-Z0-9_]{2,40}$/;
const MAX_NAME_LENGTH = 120;

export interface LoyaltyRewardProps extends Record<string, unknown> {
  rewardCode: string;
  name: string;
  menuKode: string;
  pointsRequired: number;
  hppEstimate: number;
  status: RewardStatus;
  sortOrder: number;
  version: number;
  updatedBy: string;
}

export interface CreateLoyaltyRewardInput {
  readonly id: string;
  readonly rewardCode: string;
  readonly name: string;
  readonly menuKode: string;
  readonly pointsRequired: number;
  readonly hppEstimate: number;
  readonly sortOrder: number;
  readonly status?: RewardStatus;
  readonly updatedBy: string;
}

export class LoyaltyReward extends BaseEntity<LoyaltyRewardProps> {
  private constructor(
    props: LoyaltyRewardProps,
    id: Identifier,
    createdAt: Date,
    updatedAt: Date,
  ) {
    super(props, id, createdAt, updatedAt);
  }

  static create(input: CreateLoyaltyRewardInput): LoyaltyReward {
    if (!input.updatedBy?.trim()) {
      throw DomainError.invalidArgument('updatedBy is required', 'updatedBy');
    }

    const rewardCode = input.rewardCode.trim().toUpperCase();
    if (!REWARD_CODE_PATTERN.test(rewardCode)) {
      throw DomainError.invalidArgument(
        'rewardCode harus format REWARD_XXX',
        'rewardCode',
      );
    }

    const name = input.name.trim();
    if (!name || name.length > MAX_NAME_LENGTH) {
      throw DomainError.invalidArgument('Nama reward tidak valid', 'name');
    }

    const menuKode = input.menuKode.trim().toUpperCase();
    if (!menuKode || menuKode.length > 32) {
      throw DomainError.invalidArgument('menuKode tidak valid', 'menuKode');
    }

    LoyaltyReward.assertPointsRequired(input.pointsRequired);
    LoyaltyReward.assertHppEstimate(input.hppEstimate);
    LoyaltyReward.assertSortOrder(input.sortOrder);

    const status = input.status ?? 'active';
    if (!(REWARD_STATUSES as readonly string[]).includes(status)) {
      throw DomainError.invalidArgument('status reward tidak valid', 'status');
    }

    const now = new Date();
    return new LoyaltyReward(
      {
        rewardCode,
        name,
        menuKode,
        pointsRequired: input.pointsRequired,
        hppEstimate: input.hppEstimate,
        status,
        sortOrder: input.sortOrder,
        version: 1,
        updatedBy: input.updatedBy.trim(),
      },
      createIdentifier(input.id),
      now,
      now,
    );
  }

  static reconstitute(
    id: string,
    props: LoyaltyRewardProps,
    createdAt: Date,
    updatedAt: Date,
  ): LoyaltyReward {
    return new LoyaltyReward(props, createIdentifier(id), createdAt, updatedAt);
  }

  private static assertPointsRequired(value: number): void {
    if (!Number.isInteger(value) || value < 1) {
      throw DomainError.invalidArgument('pointsRequired harus bilangan bulat > 0', 'pointsRequired');
    }
  }

  private static assertHppEstimate(value: number): void {
    if (!Number.isInteger(value) || value < 0) {
      throw DomainError.invalidArgument('hppEstimate harus bilangan bulat >= 0', 'hppEstimate');
    }
  }

  private static assertSortOrder(value: number): void {
    if (!Number.isInteger(value) || value < 0) {
      throw DomainError.invalidArgument('sortOrder harus bilangan bulat >= 0', 'sortOrder');
    }
  }

  get rewardCode(): string {
    return this.props.rewardCode;
  }

  get name(): string {
    return this.props.name;
  }

  get menuKode(): string {
    return this.props.menuKode;
  }

  get pointsRequired(): number {
    return this.props.pointsRequired;
  }

  get hppEstimate(): number {
    return this.props.hppEstimate;
  }

  get status(): RewardStatus {
    return this.props.status;
  }

  get sortOrder(): number {
    return this.props.sortOrder;
  }

  get version(): number {
    return this.props.version;
  }

  get updatedBy(): string {
    return this.props.updatedBy;
  }

  /**
   * Update catalog fields. Increments version when economic fields change
   * (pointsRequired, hppEstimate, menuKode) so future redemptions can snapshot.
   */
  update(input: {
    name?: string;
    menuKode?: string;
    pointsRequired?: number;
    hppEstimate?: number;
    sortOrder?: number;
    status?: RewardStatus;
    updatedBy: string;
  }): LoyaltyReward {
    if (!input.updatedBy?.trim()) {
      throw DomainError.invalidArgument('updatedBy is required', 'updatedBy');
    }

    let name = this.props.name;
    let menuKode = this.props.menuKode;
    let pointsRequired = this.props.pointsRequired;
    let hppEstimate = this.props.hppEstimate;
    let sortOrder = this.props.sortOrder;
    let status = this.props.status;
    let version = this.props.version;
    let economicChanged = false;
    let changed = false;

    if (input.name !== undefined) {
      const trimmed = input.name.trim();
      if (!trimmed || trimmed.length > MAX_NAME_LENGTH) {
        throw DomainError.invalidArgument('Nama reward tidak valid', 'name');
      }
      if (trimmed !== name) {
        name = trimmed;
        changed = true;
      }
    }

    if (input.menuKode !== undefined) {
      const kode = input.menuKode.trim().toUpperCase();
      if (!kode || kode.length > 32) {
        throw DomainError.invalidArgument('menuKode tidak valid', 'menuKode');
      }
      if (kode !== menuKode) {
        menuKode = kode;
        economicChanged = true;
        changed = true;
      }
    }

    if (input.pointsRequired !== undefined) {
      LoyaltyReward.assertPointsRequired(input.pointsRequired);
      if (input.pointsRequired !== pointsRequired) {
        pointsRequired = input.pointsRequired;
        economicChanged = true;
        changed = true;
      }
    }

    if (input.hppEstimate !== undefined) {
      LoyaltyReward.assertHppEstimate(input.hppEstimate);
      if (input.hppEstimate !== hppEstimate) {
        hppEstimate = input.hppEstimate;
        economicChanged = true;
        changed = true;
      }
    }

    if (input.sortOrder !== undefined) {
      LoyaltyReward.assertSortOrder(input.sortOrder);
      if (input.sortOrder !== sortOrder) {
        sortOrder = input.sortOrder;
        changed = true;
      }
    }

    if (input.status !== undefined) {
      if (!(REWARD_STATUSES as readonly string[]).includes(input.status)) {
        throw DomainError.invalidArgument('status reward tidak valid', 'status');
      }
      if (input.status !== status) {
        status = input.status;
        changed = true;
      }
    }

    if (!changed) return this;
    if (economicChanged) version += 1;

    return new LoyaltyReward(
      {
        ...this.props,
        name,
        menuKode,
        pointsRequired,
        hppEstimate,
        sortOrder,
        status,
        version,
        updatedBy: input.updatedBy.trim(),
      },
      this.id,
      this.createdAt,
      new Date(),
    );
  }

  deactivate(updatedBy: string): LoyaltyReward {
    return this.update({ status: 'inactive', updatedBy });
  }
}
