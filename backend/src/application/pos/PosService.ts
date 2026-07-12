import { NotFoundException, ValidationException } from '../../core/exceptions/BaseException.js';
import type { IRepository } from '../../core/persistence/IBaseRepository.js';
import { Order } from '../../domain/pos/Order.js';
import { OrderItem } from '../../domain/pos/OrderItem.js';
import { Menu } from '../../domain/pos/Menu.js';
import { Shift } from '../../domain/pos/Shift.js';
import type { DiningType, PaymentMethod } from '../../domain/pos/PosTypes.js';
import type { MongoUnitOfWork } from '../../infrastructure/persistence/MongoUnitOfWork.js';
import type { MongoOrderNumberGenerator } from '../../infrastructure/pos/MongoOrderNumberGenerator.js';
import type { PaymentWriter } from '../../infrastructure/pos/PaymentWriter.js';
import type { EventPublisher } from '../events/EventPublisher.js';
import type { OutboxDispatcher } from '../../infrastructure/events/EventPersistence.js';
import type { IEventStore } from '../../core/events/IEventStore.js';
import type { IOutboxRepository } from '../../core/events/IOutboxRepository.js';
import { FilterObject } from '../common/Filter.js';
import { getOrderModel } from '../../infrastructure/pos/documents/OrderDocument.js';
import { getPaymentModel } from '../../infrastructure/pos/documents/OrderItemDocument.js';
import { createIdentifier } from '../../domain/common/Identifier.js';

export interface CartItemInput {
  kodeMenu: string;
  qty: number;
  note?: string;
}

export interface PosServiceDeps {
  unitOfWork: MongoUnitOfWork;
  menuRepository: IRepository<Menu>;
  orderRepository: IRepository<Order>;
  shiftRepository: IRepository<Shift>;
  orderNumberGenerator: MongoOrderNumberGenerator;
  paymentWriter: PaymentWriter;
  eventPublisher: EventPublisher;
  outboxDispatcher: OutboxDispatcher;
  eventStore: IEventStore;
  outbox: IOutboxRepository;
}

function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfToday(): Date {
  const d = new Date();
  d.setHours(23, 59, 59, 999);
  return d;
}

export class PosService {
  constructor(private readonly deps: PosServiceDeps) {}

  async listMenus(): Promise<Menu[]> {
    const menus = await this.deps.menuRepository.findAll();
    return menus.filter((menu) => menu.status !== 'hidden');
  }

  async createDraftOrder(input: {
    diningType: DiningType;
    cashierId: string;
    cashierName: string;
    shiftId?: string;
    correlationId?: string;
  }): Promise<Order> {
    const orderNumber = await this.deps.orderNumberGenerator.next();
    const order = Order.createDraft({
      id: crypto.randomUUID(),
      orderNumber,
      diningType: input.diningType,
      cashierId: input.cashierId,
      cashierName: input.cashierName,
      shiftId: input.shiftId,
    });
    return this.deps.orderRepository.save(order);
  }

  private async findMenuByKode(kodeMenu: string): Promise<Menu | null> {
    const normalized = kodeMenu.trim().toUpperCase();
    const menus = await this.deps.menuRepository.findAll({
      filter: FilterObject.create().eq('kodeMenu', normalized).build(),
    });
    return menus[0] ?? null;
  }

  async updateOrderItems(orderId: string, items: CartItemInput[]): Promise<Order> {
    const order = await this.deps.orderRepository.findById(createIdentifier(orderId));
    if (!order) throw new NotFoundException('Order tidak ditemukan');
    if (order.status !== 'draft') {
      throw new ValidationException('Hanya order draft yang dapat diubah');
    }

    const orderItems: OrderItem[] = [];
    for (const item of items) {
      const menu = await this.findMenuByKode(item.kodeMenu);
      if (!menu) throw new NotFoundException(`Menu ${item.kodeMenu} tidak ditemukan`);
      if (!menu.isSellable()) {
        throw new ValidationException(`Menu ${menu.namaMenu} tidak tersedia`);
      }
      orderItems.push(
        new OrderItem(
          crypto.randomUUID(),
          OrderItem.snapshotFromMenu({
            kodeMenu: menu.kodeMenu,
            namaMenu: menu.namaMenu,
            kodeKategori: menu.kodeKategori,
            namaKategori: menu.namaKategori,
            tipeMenu: menu.tipeMenu,
            hargaJual: menu.hargaJual,
            qty: item.qty,
            note: item.note,
          }),
        ),
      );
    }

    const updated = order.setItems(orderItems);
    return this.deps.orderRepository.save(updated);
  }

  async payOrder(input: {
    orderId: string;
    paymentMethod: PaymentMethod;
    paidAmount?: number;
    correlationId?: string;
  }): Promise<Order> {
    const paidOrder = await this.deps.unitOfWork.execute(async () => {
      const session = this.deps.unitOfWork.getActiveSession();
      const order = await this.deps.orderRepository.findById(createIdentifier(input.orderId));
      if (!order) throw new NotFoundException('Order tidak ditemukan');

      const tender =
        input.paidAmount !== undefined ? { paidAmount: input.paidAmount } : undefined;
      const paid = order.pay(input.paymentMethod, tender, input.correlationId);
      await this.deps.orderRepository.save(paid);
      await this.deps.paymentWriter.persistPaidOrder(paid, input.paymentMethod, session);

      for (const event of paid.clearDomainEvents()) {
        await this.deps.eventPublisher.publish(event, session);
      }

      return paid;
    });

    await this.deps.outboxDispatcher.dispatchPending();
    return paidOrder;
  }

  async getOrder(orderId: string): Promise<Order> {
    const order = await this.deps.orderRepository.findById(createIdentifier(orderId));
    if (!order) throw new NotFoundException('Order tidak ditemukan');
    return order;
  }

  async listTodayOrders(): Promise<Order[]> {
    const docs = await getOrderModel()
      .find({
        status: 'paid',
        paidAt: { $gte: startOfToday(), $lte: endOfToday() },
      })
      .sort({ paidAt: -1 })
      .lean();

    return docs.map((doc) =>
      Order.reconstitute(
        doc._id,
        {
          orderNumber: doc.orderNumber,
          status: doc.status,
          diningType: doc.diningType,
          cashierId: doc.cashierId,
          cashierName: doc.cashierName,
          shiftId: doc.shiftId,
          items: doc.items.map(
            (item) =>
              new OrderItem(item._id, {
                kodeMenu: item.kodeMenu,
                namaMenu: item.namaMenu,
                kodeKategori: item.kodeKategori,
                namaKategori: item.namaKategori,
                tipeMenu: item.tipeMenu,
                hargaJual: item.hargaJual,
                qty: item.qty,
                subtotal: item.subtotal,
                note: item.note,
              }),
          ),
          paymentMethod: doc.paymentMethod,
          paidAmount: doc.paidAmount,
          changeAmount: doc.changeAmount,
          paidAt: doc.paidAt,
        },
        doc.createdAt,
        doc.updatedAt,
      ),
    );
  }

  async openShift(cashierId: string, cashierName: string, openingCash: number): Promise<Shift> {
    const existing = await this.deps.shiftRepository.findAll({
      filter: FilterObject.create().eq('status', 'open').eq('cashierId', cashierId).build(),
    });
    if (existing.length > 0) {
      throw new ValidationException('Shift masih terbuka');
    }

    const shift = Shift.open(crypto.randomUUID(), cashierId, cashierName, openingCash);
    return this.deps.shiftRepository.save(shift);
  }

  async closeShift(shiftId: string, closingCash: number): Promise<Shift> {
    const shift = await this.deps.shiftRepository.findById(createIdentifier(shiftId));
    if (!shift) throw new NotFoundException('Shift tidak ditemukan');
    const closed = shift.close(closingCash);
    return this.deps.shiftRepository.save(closed);
  }

  async getOpenShift(cashierId: string): Promise<Shift | null> {
    const shifts = await this.deps.shiftRepository.findAll({
      filter: FilterObject.create().eq('status', 'open').eq('cashierId', cashierId).build(),
    });
    return shifts[0] ?? null;
  }

  async getOwnerDashboardToday() {
    const paidAtFilter = { $gte: startOfToday(), $lte: endOfToday() };
    const orders = await getOrderModel().find({ status: 'paid', paidAt: paidAtFilter }).lean();
    const payments = await getPaymentModel().find({ paidAt: paidAtFilter }).lean();

    const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0);
    const byMethod = {
      cash: payments.filter((p) => p.method === 'cash').reduce((s, p) => s + p.amount, 0),
      qris: payments.filter((p) => p.method === 'qris').reduce((s, p) => s + p.amount, 0),
      transfer: payments.filter((p) => p.method === 'transfer').reduce((s, p) => s + p.amount, 0),
    };

    return {
      transactionCount: orders.length,
      revenue: totalRevenue,
      paymentBreakdown: byMethod,
    };
  }
}
