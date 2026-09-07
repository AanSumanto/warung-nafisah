import { AggregateRoot } from '../base/AggregateRoot.js';
import type { Identifier } from '../common/Identifier.js';
import { createIdentifier } from '../common/Identifier.js';
import { BusinessEvent } from '../events/BusinessEvent.js';
import { DomainError } from '../errors/DomainError.js';
import { OrderItem } from './OrderItem.js';
import { assertIntegerRupiah } from './integerMoney.js';
import type { DiningType, OrderStatus, PaymentMethod } from './PosTypes.js';

export interface PaymentTender {
  readonly paidAmount: number;
}

/** Immutable member identity captured at attachment / sale time. No raw phone. */
export interface OrderCustomerSnapshot {
  readonly customerId: string;
  readonly phoneMasked: string;
  readonly name?: string;
}

/**
 * Transaction-time loyalty receipt snapshot (LOYALTY-05+).
 * Not a second ledger — reprint uses this; earn/redeem never re-run.
 */
export interface OrderLoyaltyRedemptionSnapshot {
  readonly rewardCode: string;
  readonly rewardName: string;
  readonly menuKode: string;
  readonly pointsUsed: number;
  readonly rewardHppSnapshot: number;
  readonly ledgerEntryId: string;
  readonly balanceAfter: number;
}

export interface OrderLoyaltyReceipt {
  readonly awarded: true;
  readonly pointsEarned: number;
  readonly balanceAfter: number;
  readonly eligiblePaidAmount: number;
  readonly programVersion: number;
  readonly pointEarnRate: number;
  readonly ledgerEntryId: string;
  readonly phoneMasked: string;
  readonly name?: string;
  readonly publicMemberId: string;
  readonly progressMessage: string;
  readonly memberPortalUrl?: string;
  readonly nextRewardName?: string;
  readonly nextRewardPointsRemaining?: number;
  readonly redemption?: OrderLoyaltyRedemptionSnapshot;
}

/** Draft-only — does NOT deduct points. */
export interface OrderLoyaltyRedemptionIntent {
  readonly rewardCode: string;
  readonly customerId: string;
  readonly selectedAt: Date;
  readonly selectedBy: string;
}

export interface OrderRecord {
  orderNumber: string;
  status: OrderStatus;
  diningType: DiningType;
  cashierId: string;
  cashierName: string;
  shiftId?: string;
  items: OrderItem[];
  paymentMethod?: PaymentMethod;
  paidAmount?: number;
  changeAmount?: number;
  paidAt?: Date;
  /** Optional LOYALTY-04 member link — absent on historical / non-member orders. */
  customerId?: string;
  customerSnapshot?: OrderCustomerSnapshot;
  loyaltyReceipt?: OrderLoyaltyReceipt;
  loyaltyRedemptionIntent?: OrderLoyaltyRedemptionIntent;
}

export class Order extends AggregateRoot {
  private readonly orderRecord: OrderRecord;

  private constructor(
    id: Identifier,
    orderRecord: OrderRecord,
    createdAt: Date,
    updatedAt: Date,
  ) {
    super({}, id, createdAt, updatedAt);
    this.orderRecord = orderRecord;
  }

  static createDraft(input: {
    id: string;
    orderNumber: string;
    diningType: DiningType;
    cashierId: string;
    cashierName: string;
    shiftId?: string;
  }): Order {
    const now = new Date();
    return new Order(
      createIdentifier(input.id),
      {
        orderNumber: input.orderNumber,
        status: 'draft',
        diningType: input.diningType,
        cashierId: input.cashierId,
        cashierName: input.cashierName,
        shiftId: input.shiftId,
        items: [],
      },
      now,
      now,
    );
  }

  static reconstitute(
    id: string,
    record: OrderRecord,
    createdAt: Date,
    updatedAt: Date,
  ): Order {
    return new Order(createIdentifier(id), record, createdAt, updatedAt);
  }

  get orderNumber(): string {
    return this.orderRecord.orderNumber;
  }

  get status(): OrderStatus {
    return this.orderRecord.status;
  }

  get diningType(): DiningType {
    return this.orderRecord.diningType;
  }

  get cashierId(): string {
    return this.orderRecord.cashierId;
  }

  get cashierName(): string {
    return this.orderRecord.cashierName;
  }

  get shiftId(): string | undefined {
    return this.orderRecord.shiftId;
  }

  get items(): readonly OrderItem[] {
    return this.orderRecord.items;
  }

  get paymentMethod(): PaymentMethod | undefined {
    return this.orderRecord.paymentMethod;
  }

  get paidAt(): Date | undefined {
    return this.orderRecord.paidAt;
  }

  get paidAmount(): number | undefined {
    return this.orderRecord.paidAmount;
  }

  get changeAmount(): number | undefined {
    return this.orderRecord.changeAmount;
  }

  get customerId(): string | undefined {
    return this.orderRecord.customerId;
  }

  get customerSnapshot(): OrderCustomerSnapshot | undefined {
    return this.orderRecord.customerSnapshot;
  }

  get loyaltyReceipt(): OrderLoyaltyReceipt | undefined {
    return this.orderRecord.loyaltyReceipt;
  }

  get loyaltyRedemptionIntent(): OrderLoyaltyRedemptionIntent | undefined {
    return this.orderRecord.loyaltyRedemptionIntent;
  }

  get total(): number {
    return this.orderRecord.items.reduce((sum, item) => sum + item.subtotal, 0);
  }

  /** Merchandise total excluding REWARD lines (Rp0). */
  get paidMerchandiseTotal(): number {
    return this.orderRecord.items
      .filter((item) => item.lineKind !== 'REWARD')
      .reduce((sum, item) => sum + item.subtotal, 0);
  }

  private assertDraft(): void {
    if (this.orderRecord.status !== 'draft') {
      throw DomainError.invariant('Order is not in draft status');
    }
  }

  setItems(items: OrderItem[]): Order {
    this.assertDraft();
    if (items.some((item) => item.lineKind === 'REWARD')) {
      throw DomainError.invalidArgument(
        'REWARD lines cannot be set via cart; use redemption intent',
        'items',
      );
    }
    return new Order(
      this.id,
      { ...this.orderRecord, items: [...items] },
      this.createdAt,
      new Date(),
    );
  }

  /**
   * Attach or replace member on a draft order. Snapshot is immutable at sale time.
   * Changing member clears any redemption intent.
   */
  attachCustomer(snapshot: OrderCustomerSnapshot): Order {
    this.assertDraft();
    if (!snapshot.customerId?.trim()) {
      throw DomainError.invalidArgument('customerId is required', 'customerId');
    }
    if (!snapshot.phoneMasked?.trim()) {
      throw DomainError.invalidArgument('phoneMasked is required', 'phoneMasked');
    }
    const customerId = snapshot.customerId.trim();
    const { loyaltyRedemptionIntent: _intent, ...rest } = this.orderRecord;
    return new Order(
      this.id,
      {
        ...rest,
        customerId,
        customerSnapshot: {
          customerId,
          phoneMasked: snapshot.phoneMasked.trim(),
          name: snapshot.name?.trim() || undefined,
        },
        items: [...this.orderRecord.items],
      },
      this.createdAt,
      new Date(),
    );
  }

  /** Remove member from a draft order (Tanpa Member / Lewati). Clears redemption intent. */
  clearCustomer(): Order {
    this.assertDraft();
    const {
      customerId: _c,
      customerSnapshot: _s,
      loyaltyRedemptionIntent: _i,
      ...rest
    } = this.orderRecord;
    return new Order(
      this.id,
      { ...rest, items: [...this.orderRecord.items] },
      this.createdAt,
      new Date(),
    );
  }

  setRedemptionIntent(intent: OrderLoyaltyRedemptionIntent): Order {
    this.assertDraft();
    if (!this.orderRecord.customerId) {
      throw DomainError.invariant('Member harus dilampirkan sebelum pilih reward');
    }
    if (intent.customerId !== this.orderRecord.customerId) {
      throw DomainError.invalidArgument('customerId tidak cocok dengan order', 'customerId');
    }
    if (!intent.rewardCode?.trim()) {
      throw DomainError.invalidArgument('rewardCode is required', 'rewardCode');
    }
    return new Order(
      this.id,
      {
        ...this.orderRecord,
        loyaltyRedemptionIntent: {
          rewardCode: intent.rewardCode.trim().toUpperCase(),
          customerId: intent.customerId.trim(),
          selectedAt: intent.selectedAt,
          selectedBy: intent.selectedBy.trim(),
        },
      },
      this.createdAt,
      new Date(),
    );
  }

  clearRedemptionIntent(): Order {
    this.assertDraft();
    const { loyaltyRedemptionIntent: _i, ...rest } = this.orderRecord;
    return new Order(
      this.id,
      { ...rest, items: [...this.orderRecord.items] },
      this.createdAt,
      new Date(),
    );
  }

  /**
   * Attach Rp0 REWARD line and clear intent (draft → ready for pay).
   * At most one REWARD line per order.
   */
  materializeRewardLine(rewardItem: OrderItem): Order {
    this.assertDraft();
    if (rewardItem.lineKind !== 'REWARD') {
      throw DomainError.invalidArgument('Expected REWARD line', 'lineKind');
    }
    if (this.orderRecord.items.some((item) => item.lineKind === 'REWARD')) {
      throw DomainError.invariant('Order already has a REWARD line');
    }
    const { loyaltyRedemptionIntent: _i, ...rest } = this.orderRecord;
    return new Order(
      this.id,
      {
        ...rest,
        items: [...this.orderRecord.items, rewardItem],
      },
      this.createdAt,
      new Date(),
    );
  }

  /** Attach immutable loyalty receipt snapshot after successful earn (paid orders only). */
  withLoyaltyReceipt(receipt: OrderLoyaltyReceipt): Order {
    if (this.orderRecord.status !== 'paid') {
      throw DomainError.invariant('Loyalty receipt only applies to paid orders');
    }
    return new Order(
      this.id,
      { ...this.orderRecord, loyaltyReceipt: { ...receipt } },
      this.createdAt,
      new Date(),
    );
  }

  pay(paymentMethod: PaymentMethod, tender?: PaymentTender, correlationId?: string): Order {
    this.assertDraft();
    if (this.orderRecord.items.length === 0) {
      throw DomainError.invariant('Cannot pay an empty order');
    }

    const grandTotal = this.total;
    const paidAmount = tender?.paidAmount ?? grandTotal;
    assertIntegerRupiah(paidAmount, 'paidAmount');
    if (paidAmount < grandTotal) {
      throw DomainError.invalidArgument('paidAmount cannot be less than grand total', 'paidAmount');
    }
    const changeAmount = paidAmount - grandTotal;
    assertIntegerRupiah(changeAmount, 'changeAmount');

    const paidAt = new Date();
    const paid = new Order(
      this.id,
      {
        ...this.orderRecord,
        status: 'paid',
        paymentMethod,
        paidAmount,
        changeAmount,
        paidAt,
      },
      this.createdAt,
      paidAt,
    );

    paid.addDomainEvent(
      BusinessEvent.create({
        eventName: 'SaleCompleted',
        aggregateId: this.id,
        aggregateType: 'Order',
        payload: {
          orderId: this.id,
          orderNumber: this.orderNumber,
          diningType: this.diningType,
          paymentMethod,
          total: grandTotal,
          paidAmount,
          changeAmount,
          cashierId: this.cashierId,
          cashierName: this.cashierName,
          shiftId: this.shiftId,
          paidAt: paidAt.toISOString(),
          items: this.orderRecord.items.map((item) => item.toJSON()),
          ...(this.customerId
            ? {
                customerId: this.customerId,
                phoneMasked: this.customerSnapshot?.phoneMasked,
              }
            : {}),
        },
        metadata: {
          correlationId,
          userId: this.cashierId,
        },
      }),
    );

    return paid;
  }

  cancel(): Order {
    this.assertDraft();
    return new Order(
      this.id,
      { ...this.orderRecord, status: 'cancelled' },
      this.createdAt,
      new Date(),
    );
  }

  toRecord(): OrderRecord {
    return {
      ...this.orderRecord,
      items: [...this.orderRecord.items],
      customerSnapshot: this.orderRecord.customerSnapshot
        ? { ...this.orderRecord.customerSnapshot }
        : undefined,
      loyaltyReceipt: this.orderRecord.loyaltyReceipt
        ? {
            ...this.orderRecord.loyaltyReceipt,
            redemption: this.orderRecord.loyaltyReceipt.redemption
              ? { ...this.orderRecord.loyaltyReceipt.redemption }
              : undefined,
          }
        : undefined,
      loyaltyRedemptionIntent: this.orderRecord.loyaltyRedemptionIntent
        ? { ...this.orderRecord.loyaltyRedemptionIntent }
        : undefined,
    };
  }
}
