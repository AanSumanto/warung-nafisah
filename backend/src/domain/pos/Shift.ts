import { BaseEntity } from '../base/BaseEntity.js';
import { createIdentifier } from '../common/Identifier.js';
import type { Identifier } from '../common/Identifier.js';
import { DomainError } from '../errors/DomainError.js';
import { assertIntegerRupiah } from './integerMoney.js';
import type { ShiftStatus } from './PosTypes.js';

export interface ShiftProps extends Record<string, unknown> {
  cashierId: string;
  cashierName: string;
  status: ShiftStatus;
  openingCash: number;
  closingCash?: number;
  openedAt: Date;
  closedAt?: Date;
}

export class Shift extends BaseEntity<ShiftProps> {
  private constructor(props: ShiftProps, id: Identifier, createdAt: Date, updatedAt: Date) {
    super(props, id, createdAt, updatedAt);
  }

  static open(id: string, cashierId: string, cashierName: string, openingCash: number): Shift {
    assertIntegerRupiah(openingCash, 'openingCash');
    const now = new Date();
    return new Shift(
      {
        cashierId,
        cashierName,
        status: 'open',
        openingCash,
        openedAt: now,
      },
      createIdentifier(id),
      now,
      now,
    );
  }

  static reconstitute(id: string, props: ShiftProps, createdAt: Date, updatedAt: Date): Shift {
    return new Shift(props, createIdentifier(id), createdAt, updatedAt);
  }

  get cashierId(): string {
    return this.props.cashierId;
  }

  get cashierName(): string {
    return this.props.cashierName;
  }

  get status(): ShiftStatus {
    return this.props.status;
  }

  get openingCash(): number {
    return this.props.openingCash;
  }

  get closingCash(): number | undefined {
    return this.props.closingCash;
  }

  get openedAt(): Date {
    return this.props.openedAt;
  }

  get closedAt(): Date | undefined {
    return this.props.closedAt;
  }

  close(closingCash: number): Shift {
    if (this.props.status !== 'open') {
      throw DomainError.invariant('Shift is not open');
    }
    assertIntegerRupiah(closingCash, 'closingCash');
    const now = new Date();
    return new Shift(
      {
        ...this.props,
        status: 'closed',
        closingCash,
        closedAt: now,
      },
      this.id,
      this.createdAt,
      now,
    );
  }
}
