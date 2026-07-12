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

  get total(): number {
    return this.orderRecord.items.reduce((sum, item) => sum + item.subtotal, 0);
  }

  private assertDraft(): void {
    if (this.orderRecord.status !== 'draft') {
      throw DomainError.invariant('Order is not in draft status');
    }
  }

  setItems(items: OrderItem[]): Order {
    this.assertDraft();
    return new Order(
      this.id,
      { ...this.orderRecord, items: [...items] },
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
    };
  }
}
