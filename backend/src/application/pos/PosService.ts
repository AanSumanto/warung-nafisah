import { NotFoundException, ValidationException, ForbiddenException } from '../../core/exceptions/BaseException.js';
import type { IRepository } from '../../core/persistence/IBaseRepository.js';
import { Order } from '../../domain/pos/Order.js';
import { OrderItem } from '../../domain/pos/OrderItem.js';
import { Menu } from '../../domain/pos/Menu.js';
import { Shift } from '../../domain/pos/Shift.js';
import type { DiningType, PaymentMethod, UserRole, MenuCategoryCode, MenuType } from '../../domain/pos/PosTypes.js';
import { CATEGORY_LABELS } from '../../domain/pos/PosTypes.js';
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
import { DomainError } from '../../domain/errors/DomainError.js';
import type { ICustomerRepository } from '../../domain/loyalty/ICustomerRepository.js';
import type { ILoyaltyProgramRepository } from '../../domain/loyalty/ILoyaltyProgramRepository.js';
import { LOYALTY_PROGRAM_CODE } from '../../domain/loyalty/LoyaltyTypes.js';
import type { LoyaltyEarnService } from '../loyalty/LoyaltyEarnService.js';
import { deriveEligiblePaidAmount } from './deriveEligiblePaidAmount.js';
import {
  loyaltyNoMember,
  loyaltySkipped,
  type LoyaltyPayResult,
} from './LoyaltyPayResult.js';

export interface CartItemInput {
  kodeMenu: string;
  qty: number;
  note?: string;
}

export interface RequesterContext {
  readonly sub: string;
  readonly role: UserRole;
}

export interface PayOrderResult {
  readonly order: Order;
  readonly loyalty: LoyaltyPayResult;
}

function assertOrderAccess(order: Order, requester: RequesterContext): void {
  if (requester.role === 'owner') return;
  if (order.cashierId !== requester.sub) {
    throw new ForbiddenException('Akses ditolak');
  }
}

function assertShiftAccess(shift: Shift, requester: RequesterContext): void {
  if (requester.role === 'owner') return;
  if (shift.cashierId !== requester.sub) {
    throw new ForbiddenException('Akses ditolak');
  }
}

function mapDomainError(error: unknown): never {
  if (error instanceof DomainError) {
    throw new ValidationException(error.message, error.field ? { field: error.field } : undefined);
  }
  throw error;
}

export interface PosLoyaltyDeps {
  loyaltyEarnService: LoyaltyEarnService;
  customerRepository: ICustomerRepository;
  programRepository: ILoyaltyProgramRepository;
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
  /** Optional until wired — without loyalty, pay skips earn. */
  loyalty?: PosLoyaltyDeps;
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

function startOfMonth(year: number, month: number): Date {
  return new Date(year, month - 1, 1, 0, 0, 0, 0);
}

function endOfMonth(year: number, month: number): Date {
  return new Date(year, month, 0, 23, 59, 59, 999);
}

async function aggregateDashboard(paidAtFilter: { $gte: Date; $lte: Date }) {
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

function orderCustomerFields(doc: {
  customerId?: string | null;
  customerSnapshot?: { customerId: string; phoneMasked: string; name?: string } | null;
}) {
  return {
    customerId: doc.customerId ?? undefined,
    customerSnapshot: doc.customerSnapshot
      ? {
          customerId: doc.customerSnapshot.customerId,
          phoneMasked: doc.customerSnapshot.phoneMasked,
          name: doc.customerSnapshot.name,
        }
      : undefined,
  };
}

export class PosService {
  constructor(private readonly deps: PosServiceDeps) {}

  async listMenus(): Promise<Menu[]> {
    const menus = await this.deps.menuRepository.findAll();
    return menus.filter((menu) => menu.status !== 'hidden');
  }

  async listMenusForManagement(): Promise<Menu[]> {
    const menus = await this.deps.menuRepository.findAll();
    return menus
      .filter((menu) => menu.status !== 'hidden')
      .sort((a, b) => a.kodeMenu.localeCompare(b.kodeMenu));
  }

  async updateMenuHarga(kodeMenu: string, hargaJual: number): Promise<Menu> {
    const menu = await this.findMenuByKode(kodeMenu);
    if (!menu) throw new NotFoundException('Menu tidak ditemukan');
    const updated = menu.update({ hargaJual });
    return this.deps.menuRepository.save(updated);
  }

  async createMenu(input: {
    kodeMenu: string;
    namaMenu: string;
    kodeKategori: MenuCategoryCode;
    hargaJual: number;
    tipeMenu?: MenuType;
    sellingTime?: string;
  }): Promise<Menu> {
    const existing = await this.findMenuByKode(input.kodeMenu);
    if (existing) {
      throw new ValidationException('Kode menu sudah digunakan');
    }

    const menu = Menu.create(crypto.randomUUID(), {
      kodeMenu: input.kodeMenu,
      namaMenu: input.namaMenu,
      tipeMenu: input.tipeMenu ?? 'ITEM',
      kodeKategori: input.kodeKategori,
      namaKategori: CATEGORY_LABELS[input.kodeKategori],
      hargaJual: input.hargaJual,
      status: 'available',
      sellingTime: input.sellingTime,
    });

    return this.deps.menuRepository.save(menu);
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

  async updateOrderItems(
    orderId: string,
    items: CartItemInput[],
    requester: RequesterContext,
  ): Promise<Order> {
    const order = await this.deps.orderRepository.findById(createIdentifier(orderId));
    if (!order) throw new NotFoundException('Order tidak ditemukan');
    assertOrderAccess(order, requester);
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

  async attachOrderCustomer(
    orderId: string,
    customerId: string,
    requester: RequesterContext,
  ): Promise<Order> {
    const loyalty = this.requireLoyalty();
    const order = await this.deps.orderRepository.findById(createIdentifier(orderId));
    if (!order) throw new NotFoundException('Order tidak ditemukan');
    assertOrderAccess(order, requester);
    if (order.status !== 'draft') {
      throw new ValidationException('Member hanya dapat diubah pada order draft', {
        code: 'ORDER_NOT_DRAFT',
      });
    }

    const customer = await loyalty.customerRepository.findById(createIdentifier(customerId.trim()));
    if (!customer) {
      throw new NotFoundException('Pelanggan tidak ditemukan', {
        code: 'LOYALTY_CUSTOMER_NOT_FOUND',
      });
    }
    if (customer.status === 'blocked') {
      throw new ValidationException('Pelanggan diblokir; tidak dapat dilampirkan', {
        code: 'LOYALTY_CUSTOMER_BLOCKED',
      });
    }

    try {
      const updated = order.attachCustomer({
        customerId: customer.id,
        phoneMasked: customer.phoneMasked,
        name: customer.name,
      });
      return await this.deps.orderRepository.save(updated);
    } catch (error) {
      mapDomainError(error);
    }
  }

  async clearOrderCustomer(orderId: string, requester: RequesterContext): Promise<Order> {
    const order = await this.deps.orderRepository.findById(createIdentifier(orderId));
    if (!order) throw new NotFoundException('Order tidak ditemukan');
    assertOrderAccess(order, requester);
    if (order.status !== 'draft') {
      throw new ValidationException('Member hanya dapat diubah pada order draft', {
        code: 'ORDER_NOT_DRAFT',
      });
    }
    try {
      const updated = order.clearCustomer();
      return await this.deps.orderRepository.save(updated);
    } catch (error) {
      mapDomainError(error);
    }
  }

  async payOrder(input: {
    orderId: string;
    paymentMethod: PaymentMethod;
    paidAmount?: number;
    correlationId?: string;
    requester: RequesterContext;
  }): Promise<PayOrderResult> {
    const result = await this.deps.unitOfWork.execute(async () => {
      const session = this.deps.unitOfWork.getActiveSession();
      const order = await this.deps.orderRepository.findById(createIdentifier(input.orderId));
      if (!order) throw new NotFoundException('Order tidak ditemukan');
      assertOrderAccess(order, input.requester);

      const tender =
        input.paidAmount !== undefined ? { paidAmount: input.paidAmount } : undefined;
      const paid = order.pay(input.paymentMethod, tender, input.correlationId);
      await this.deps.orderRepository.save(paid);
      await this.deps.paymentWriter.persistPaidOrder(paid, input.paymentMethod, session);

      const loyalty = await this.applyLoyaltyEarnInActiveSession(paid);

      for (const event of paid.clearDomainEvents()) {
        await this.deps.eventPublisher.publish(event, session);
      }

      return { order: paid, loyalty };
    });

    await this.deps.outboxDispatcher.dispatchPending();
    return result;
  }

  /**
   * Loyalty orchestration inside an active pay UoW session.
   * Non-fatal skips never throw LOYALTY_PROGRAM_DISABLED into payment.
   * Fatal earn failures propagate and abort the whole payment transaction.
   */
  private async applyLoyaltyEarnInActiveSession(paid: Order): Promise<LoyaltyPayResult> {
    const snapshot = paid.customerSnapshot;
    const customerId = paid.customerId;

    if (!customerId || !snapshot) {
      return loyaltyNoMember();
    }

    const loyalty = this.deps.loyalty;
    if (!loyalty) {
      return loyaltySkipped('PROGRAM_DISABLED', snapshot);
    }

    const program = await loyalty.programRepository.findByProgramCode(LOYALTY_PROGRAM_CODE);
    if (!program || !program.enabled) {
      return loyaltySkipped('PROGRAM_DISABLED', snapshot);
    }

    const customer = await loyalty.customerRepository.findById(createIdentifier(customerId));
    if (!customer) {
      return loyaltySkipped('CUSTOMER_NOT_FOUND', snapshot);
    }
    if (customer.status === 'blocked') {
      return loyaltySkipped('CUSTOMER_BLOCKED', snapshot);
    }

    let eligiblePaidAmount: number;
    try {
      eligiblePaidAmount = deriveEligiblePaidAmount(paid);
    } catch {
      throw new ValidationException('Total order tidak valid untuk loyalty', {
        code: 'LOYALTY_INVALID_ELIGIBLE_AMOUNT',
      });
    }

    const earn = await loyalty.loyaltyEarnService.earn({
      customerId,
      orderId: String(paid.id),
      eligiblePaidAmount,
      occurredAt: paid.paidAt ?? new Date(),
      actorUserId: paid.cashierId,
      paymentId: `pay_${paid.id}`,
    });

    return {
      memberAttached: true,
      awarded: true,
      customerId: earn.customerId,
      phoneMasked: snapshot.phoneMasked,
      name: snapshot.name,
      pointsEarned: earn.pointsEarned,
      balanceAfter: earn.balanceAfter,
      eligiblePaidAmount: earn.eligiblePaidAmount,
      programCode: earn.programCode,
      programVersion: earn.programVersion,
      pointEarnRate: earn.pointEarnRate,
      ledgerEntryId: earn.ledgerEntryId,
      alreadyProcessed: earn.alreadyProcessed,
    };
  }

  private requireLoyalty(): PosLoyaltyDeps {
    if (!this.deps.loyalty) {
      throw new ValidationException('Loyalty belum dikonfigurasi', {
        code: 'LOYALTY_NOT_CONFIGURED',
      });
    }
    return this.deps.loyalty;
  }

  async getOrder(orderId: string, requester: RequesterContext): Promise<Order> {
    const order = await this.deps.orderRepository.findById(createIdentifier(orderId));
    if (!order) throw new NotFoundException('Order tidak ditemukan');
    assertOrderAccess(order, requester);
    return order;
  }

  async listTodayOrders(requester: RequesterContext): Promise<Order[]> {
    const query: Record<string, unknown> = {
      status: 'paid',
      paidAt: { $gte: startOfToday(), $lte: endOfToday() },
    };
    if (requester.role !== 'owner') {
      query.cashierId = requester.sub;
    }

    const docs = await getOrderModel().find(query).sort({ paidAt: -1 }).lean();

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
          ...orderCustomerFields(doc),
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

  async closeShift(shiftId: string, closingCash: number, requester: RequesterContext): Promise<Shift> {
    const shift = await this.deps.shiftRepository.findById(createIdentifier(shiftId));
    if (!shift) throw new NotFoundException('Shift tidak ditemukan');
    assertShiftAccess(shift, requester);
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
    return aggregateDashboard({ $gte: startOfToday(), $lte: endOfToday() });
  }

  async getOwnerDashboardMonth(year: number, month: number) {
    if (!Number.isInteger(year) || year < 2000 || year > 2100) {
      throw new ValidationException('Tahun tidak valid');
    }
    if (!Number.isInteger(month) || month < 1 || month > 12) {
      throw new ValidationException('Bulan tidak valid');
    }
    return aggregateDashboard({ $gte: startOfMonth(year, month), $lte: endOfMonth(year, month) });
  }
}
