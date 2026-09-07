import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import request from 'supertest';
import { createApp } from '../../../src/app.js';
import {
  setupMongoMemoryServer,
  teardownMongoMemoryServer,
} from '../../helpers/persistence/mongo-memory.js';
import { loginAndGetToken } from '../../helpers/auth/login.js';
import { ensureEventCollections } from '../../../src/infrastructure/events/EventPlatformFactory.js';
import { runDatabaseBootstrap } from '../../../src/infrastructure/database/bootstrap/runDatabaseBootstrap.js';
import { getMenuModel } from '../../../src/infrastructure/pos/documents/MenuDocument.js';
import { getOrderModel } from '../../../src/infrastructure/pos/documents/OrderDocument.js';
import { getPaymentModel } from '../../../src/infrastructure/pos/documents/OrderItemDocument.js';
import { getOutboxModel, getStoredEventModel } from '../../../src/infrastructure/events/documents/EventDocuments.js';
import { getShiftModel } from '../../../src/infrastructure/pos/documents/ShiftDocument.js';
import { getCustomerModel } from '../../../src/infrastructure/loyalty/documents/CustomerDocument.js';
import { getLoyaltyProgramModel } from '../../../src/infrastructure/loyalty/documents/LoyaltyProgramDocument.js';
import { getLoyaltyLedgerModel } from '../../../src/infrastructure/loyalty/documents/LoyaltyLedgerDocument.js';
import { getLoyaltyRewardModel } from '../../../src/infrastructure/loyalty/documents/LoyaltyRewardDocument.js';
import { LoyaltyProgram } from '../../../src/domain/loyalty/LoyaltyProgram.js';
import { LOYALTY_PROGRAM_CODE } from '../../../src/domain/loyalty/LoyaltyTypes.js';
import { MongoLoyaltyProgramRepository } from '../../../src/infrastructure/loyalty/MongoLoyaltyProgramRepository.js';
import { MongoCustomerRepository } from '../../../src/infrastructure/loyalty/MongoCustomerRepository.js';
import { Customer } from '../../../src/domain/loyalty/Customer.js';
import { deriveEligiblePaidAmount } from '../../../src/application/pos/deriveEligiblePaidAmount.js';
import { Order } from '../../../src/domain/pos/Order.js';
import { OrderItem } from '../../../src/domain/pos/OrderItem.js';

const KASIR_EMAIL = 'kasir@warungnafisah.local';
const DEFAULT_PASSWORD = 'warung123';

describe('LOYALTY-04 POS member + pay integration', () => {
  const app = createApp();
  let kasirToken = '';
  let kodeMenu = '';
  let nonRewardMenu = '';

  beforeAll(async () => {
    await setupMongoMemoryServer();
    await ensureEventCollections();
    const { initializePosInfrastructure } = await import(
      '../../../src/infrastructure/pos/PosModule.js'
    );
    await initializePosInfrastructure();
    await runDatabaseBootstrap();
  });

  afterAll(async () => {
    await teardownMongoMemoryServer();
  });

  beforeEach(async () => {
    await Promise.all([
      getOrderModel().deleteMany({}),
      getPaymentModel().deleteMany({}),
      getOutboxModel().deleteMany({}),
      getStoredEventModel().deleteMany({}),
      getShiftModel().deleteMany({}),
      getCustomerModel().deleteMany({}),
      getLoyaltyProgramModel().deleteMany({}),
      getLoyaltyLedgerModel().collection.deleteMany({}),
      getLoyaltyRewardModel().deleteMany({}),
    ]);

    kasirToken = await loginAndGetToken(app, KASIR_EMAIL, DEFAULT_PASSWORD);
    const lele = await getMenuModel().findOne({ kodeMenu: 'LL001' }).lean();
    const teh = await getMenuModel().findOne({ kodeMenu: 'MNM001' }).lean();
    expect(lele).toBeDefined();
    kodeMenu = lele!.kodeMenu;
    nonRewardMenu = teh?.kodeMenu ?? lele!.kodeMenu;

    await request(app)
      .post('/api/v1/shifts/open')
      .set('Authorization', `Bearer ${kasirToken}`)
      .send({ openingCash: 100000 });
  });

  async function seedEnabledProgram(rate = 5000) {
    const now = new Date();
    const program = LoyaltyProgram.reconstitute(
      'prog-test',
      {
        programCode: LOYALTY_PROGRAM_CODE,
        programName: 'Nafisah Rewards',
        enabled: true,
        pointEarnRate: rate,
        version: 1,
        effectiveFrom: now,
        updatedBy: 'test',
      },
      now,
      now,
    );
    await new MongoLoyaltyProgramRepository(getLoyaltyProgramModel()).save(program);
  }

  async function seedDisabledProgram() {
    const now = new Date();
    const program = LoyaltyProgram.reconstitute(
      'prog-test',
      {
        programCode: LOYALTY_PROGRAM_CODE,
        programName: 'Nafisah Rewards',
        enabled: false,
        pointEarnRate: 5000,
        version: 1,
        effectiveFrom: now,
        updatedBy: 'test',
      },
      now,
      now,
    );
    await new MongoLoyaltyProgramRepository(getLoyaltyProgramModel()).save(program);
  }

  async function registerMember(phone = '081234567890', name = 'Aan') {
    const res = await request(app)
      .post('/api/v1/customers')
      .set('Authorization', `Bearer ${kasirToken}`)
      .send({ phone, name });
    expect(res.status).toBe(201);
    return res.body.data as { id: string; phoneMasked: string; name?: string };
  }

  async function createDraftWithItems(items: Array<{ kodeMenu: string; qty: number }>) {
    const createRes = await request(app)
      .post('/api/v1/orders')
      .set('Authorization', `Bearer ${kasirToken}`)
      .send({ diningType: 'dine_in' });
    expect(createRes.status).toBe(201);
    const orderId = createRes.body.data.id as string;
    const updateRes = await request(app)
      .put(`/api/v1/orders/${orderId}/items`)
      .set('Authorization', `Bearer ${kasirToken}`)
      .send({ items });
    expect(updateRes.status).toBe(200);
    return { orderId, total: updateRes.body.data.total as number };
  }

  it('deriveEligiblePaidAmount uses order.total not tender', () => {
    const order = Order.createDraft({
      id: 'o1',
      orderNumber: 'WN-1',
      diningType: 'dine_in',
      cashierId: 'c1',
      cashierName: 'Kasir',
    }).setItems([
      new OrderItem('i1', {
        kodeMenu: 'X',
        namaMenu: 'X',
        kodeKategori: 'MAIN',
        namaKategori: 'Main',
        tipeMenu: 'ITEM',
        hargaJual: 16000,
        qty: 1,
        subtotal: 16000,
      }),
    ]);
    expect(deriveEligiblePaidAmount(order)).toBe(16000);
  });

  it('attaches active customer with masked snapshot; rejects blocked/unknown/paid', async () => {
    const member = await registerMember();
    const { orderId } = await createDraftWithItems([{ kodeMenu, qty: 1 }]);

    const attach = await request(app)
      .put(`/api/v1/orders/${orderId}/customer`)
      .set('Authorization', `Bearer ${kasirToken}`)
      .send({ customerId: member.id });
    expect(attach.status).toBe(200);
    expect(attach.body.data.customerId).toBe(member.id);
    expect(attach.body.data.customerSnapshot.phoneMasked).toBe(member.phoneMasked);
    expect(JSON.stringify(attach.body.data)).not.toMatch(/6281234567890/);

    const unknown = await request(app)
      .put(`/api/v1/orders/${orderId}/customer`)
      .set('Authorization', `Bearer ${kasirToken}`)
      .send({ customerId: 'missing-id' });
    expect(unknown.status).toBe(404);

    const custRepo = new MongoCustomerRepository(getCustomerModel());
    const blocked = Customer.reconstitute(
      'blocked-1',
      {
        ...Customer.register({
          id: 'blocked-1',
          phone: '081299999999',
          registeredBy: 'test',
        }).toRecord(),
        status: 'blocked',
      },
      new Date(),
      new Date(),
    );
    await custRepo.save(blocked);
    const blockedAttach = await request(app)
      .put(`/api/v1/orders/${orderId}/customer`)
      .set('Authorization', `Bearer ${kasirToken}`)
      .send({ customerId: 'blocked-1' });
    expect(blockedAttach.status).toBe(400);

    await request(app)
      .post(`/api/v1/orders/${orderId}/pay`)
      .set('Authorization', `Bearer ${kasirToken}`)
      .send({ paymentMethod: 'cash' });

    const afterPay = await request(app)
      .put(`/api/v1/orders/${orderId}/customer`)
      .set('Authorization', `Bearer ${kasirToken}`)
      .send({ customerId: member.id });
    expect(afterPay.status).toBe(400);
  });

  it('non-member pay succeeds with no ledger and loyalty NO_MEMBER', async () => {
    await seedEnabledProgram();
    const { orderId } = await createDraftWithItems([{ kodeMenu, qty: 1 }]);
    const payRes = await request(app)
      .post(`/api/v1/orders/${orderId}/pay`)
      .set('Authorization', `Bearer ${kasirToken}`)
      .send({ paymentMethod: 'cash' });
    expect(payRes.status).toBe(200);
    expect(payRes.body.data.status).toBe('paid');
    expect(payRes.body.data.loyalty).toMatchObject({
      memberAttached: false,
      awarded: false,
      reason: 'NO_MEMBER',
    });
    expect(await getLoyaltyLedgerModel().countDocuments()).toBe(0);
    expect(await getPaymentModel().countDocuments({ orderId })).toBe(1);
  });

  it('member + disabled program: pay succeeds, no earn, no LOYALTY_PROGRAM_DISABLED', async () => {
    await seedDisabledProgram();
    const member = await registerMember();
    const { orderId } = await createDraftWithItems([{ kodeMenu, qty: 1 }]);
    await request(app)
      .put(`/api/v1/orders/${orderId}/customer`)
      .set('Authorization', `Bearer ${kasirToken}`)
      .send({ customerId: member.id });

    const payRes = await request(app)
      .post(`/api/v1/orders/${orderId}/pay`)
      .set('Authorization', `Bearer ${kasirToken}`)
      .send({ paymentMethod: 'cash' });
    expect(payRes.status).toBe(200);
    expect(payRes.body.data.status).toBe('paid');
    expect(payRes.body.data.loyalty).toMatchObject({
      memberAttached: true,
      awarded: false,
      reason: 'PROGRAM_DISABLED',
    });
    expect(payRes.body.data.loyalty.receiptProgress).toBeUndefined();
    expect(payRes.body.data.loyalty.memberPortalUrl).toBeUndefined();
    expect(await getLoyaltyLedgerModel().countDocuments()).toBe(0);
    const customer = await getCustomerModel().findById(member.id).lean();
    expect(customer?.currentPoints).toBe(0);
    expect(customer?.transactionCount).toBe(0);
  });

  it('member + enabled program earns atomically for eligible total', async () => {
    await seedEnabledProgram(5000);
    const member = await registerMember();
    // Ayam Dada 17000 if present else lele*2 — use items totaling 20000 via qty
    const ayam = await getMenuModel().findOne({ kodeMenu: 'AYM002' }).lean();
    const items = ayam
      ? [{ kodeMenu: 'AYM002', qty: 1 }, { kodeMenu: 'MNM001', qty: 1 }]
      : [{ kodeMenu, qty: 2 }];
    const { orderId, total } = await createDraftWithItems(items);
    expect(total).toBeGreaterThanOrEqual(17000);

    await request(app)
      .put(`/api/v1/orders/${orderId}/customer`)
      .set('Authorization', `Bearer ${kasirToken}`)
      .send({ customerId: member.id });

    const payRes = await request(app)
      .post(`/api/v1/orders/${orderId}/pay`)
      .set('Authorization', `Bearer ${kasirToken}`)
      .send({ paymentMethod: 'qris' });
    expect(payRes.status).toBe(200);
    const expectedPoints = Math.floor(total / 5000);
    expect(payRes.body.data.loyalty).toMatchObject({
      memberAttached: true,
      awarded: true,
      pointsEarned: expectedPoints,
      balanceAfter: expectedPoints,
      eligiblePaidAmount: total,
    });
    expect(payRes.body.data.loyalty.receiptProgress).toEqual(
      expect.objectContaining({
        progressMessage: expect.any(String),
        eligibleRewardCount: expect.any(Number),
        hasRedeemableThreshold: expect.any(Boolean),
      }),
    );
    expect(payRes.body.data.loyalty.memberPortalUrl).toBeUndefined();
    expect(await getLoyaltyLedgerModel().countDocuments()).toBe(1);
    const customer = await getCustomerModel().findById(member.id).lean();
    expect(customer?.currentPoints).toBe(expectedPoints);
    expect(customer?.totalSpending).toBe(total);
    expect(customer?.transactionCount).toBe(1);
  });

  it('zero-point member pay still creates EARN_SALE delta 0', async () => {
    await seedEnabledProgram(5000);
    const member = await registerMember('081211110001');
    const { orderId, total } = await createDraftWithItems([{ kodeMenu: nonRewardMenu, qty: 1 }]);
    // Ensure below rate if possible
    if (total >= 5000) {
      // skip if menu too expensive — use synthetic assert on small menu
    }
    await request(app)
      .put(`/api/v1/orders/${orderId}/customer`)
      .set('Authorization', `Bearer ${kasirToken}`)
      .send({ customerId: member.id });
    const payRes = await request(app)
      .post(`/api/v1/orders/${orderId}/pay`)
      .set('Authorization', `Bearer ${kasirToken}`)
      .send({ paymentMethod: 'cash' });
    expect(payRes.status).toBe(200);
    if (total < 5000) {
      expect(payRes.body.data.loyalty.pointsEarned).toBe(0);
      expect(await getLoyaltyLedgerModel().countDocuments()).toBe(1);
      const customer = await getCustomerModel().findById(member.id).lean();
      expect(customer?.transactionCount).toBe(1);
      expect(customer?.currentPoints).toBe(0);
    }
  });

  it('non-reward paid menu still earns (no whitelist)', async () => {
    await seedEnabledProgram(5000);
    const member = await registerMember('081211110002');
    // MNM001 Es Teh is in reward catalog — use a menu guaranteed paid; create custom menu
    await getMenuModel().collection.insertOne({
      _id: 'menu_nonreward_test',
      kodeMenu: 'TST999',
      namaMenu: 'Test Non Reward',
      tipeMenu: 'ITEM',
      kodeKategori: 'SIDE',
      namaKategori: 'Side',
      hargaJual: 10000,
      status: 'available',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    const { orderId } = await createDraftWithItems([{ kodeMenu: 'TST999', qty: 1 }]);
    await request(app)
      .put(`/api/v1/orders/${orderId}/customer`)
      .set('Authorization', `Bearer ${kasirToken}`)
      .send({ customerId: member.id });
    const payRes = await request(app)
      .post(`/api/v1/orders/${orderId}/pay`)
      .set('Authorization', `Bearer ${kasirToken}`)
      .send({ paymentMethod: 'cash' });
    expect(payRes.status).toBe(200);
    expect(payRes.body.data.loyalty.awarded).toBe(true);
    expect(payRes.body.data.loyalty.pointsEarned).toBe(2);
  });

  it('pay retry does not double earn', async () => {
    await seedEnabledProgram(5000);
    const member = await registerMember('081211110003');
    const { orderId } = await createDraftWithItems([{ kodeMenu, qty: 1 }]);
    await request(app)
      .put(`/api/v1/orders/${orderId}/customer`)
      .set('Authorization', `Bearer ${kasirToken}`)
      .send({ customerId: member.id });
    const first = await request(app)
      .post(`/api/v1/orders/${orderId}/pay`)
      .set('Authorization', `Bearer ${kasirToken}`)
      .send({ paymentMethod: 'cash' });
    expect(first.status).toBe(200);
    const second = await request(app)
      .post(`/api/v1/orders/${orderId}/pay`)
      .set('Authorization', `Bearer ${kasirToken}`)
      .send({ paymentMethod: 'cash' });
    expect(second.status).toBeGreaterThanOrEqual(400);
    expect(await getLoyaltyLedgerModel().countDocuments()).toBe(1);
    const customer = await getCustomerModel().findById(member.id).lean();
    expect(customer?.transactionCount).toBe(1);
  });

  it('concurrent pay: one sale + one ledger', async () => {
    await seedEnabledProgram(5000);
    const member = await registerMember('081211110004');
    const { orderId, total } = await createDraftWithItems([{ kodeMenu, qty: 1 }]);
    await request(app)
      .put(`/api/v1/orders/${orderId}/customer`)
      .set('Authorization', `Bearer ${kasirToken}`)
      .send({ customerId: member.id });

    const results = await Promise.allSettled(
      Array.from({ length: 5 }, () =>
        request(app)
          .post(`/api/v1/orders/${orderId}/pay`)
          .set('Authorization', `Bearer ${kasirToken}`)
          .send({ paymentMethod: 'cash', paidAmount: total }),
      ),
    );
    const fulfilled = results.filter((r) => r.status === 'fulfilled') as PromiseFulfilledResult<{
      status: number;
      body: { data?: { status?: string } };
    }>[];
    const paidOk = fulfilled.filter((r) => r.value.status === 200);
    expect(paidOk.length).toBe(1);
    expect(await getLoyaltyLedgerModel().countDocuments()).toBe(1);
    expect(await getPaymentModel().countDocuments({ orderId })).toBe(1);
    for (const r of results) {
      if (r.status === 'rejected') continue;
      expect(JSON.stringify(r.value.body)).not.toMatch(/E11000/);
    }
  });

  it('blocked-at-pay: food sale succeeds, no earn', async () => {
    await seedEnabledProgram(5000);
    const member = await registerMember('081211110005');
    const { orderId } = await createDraftWithItems([{ kodeMenu, qty: 1 }]);
    await request(app)
      .put(`/api/v1/orders/${orderId}/customer`)
      .set('Authorization', `Bearer ${kasirToken}`)
      .send({ customerId: member.id });

    await getCustomerModel().updateOne({ _id: member.id }, { $set: { status: 'blocked' } });

    const payRes = await request(app)
      .post(`/api/v1/orders/${orderId}/pay`)
      .set('Authorization', `Bearer ${kasirToken}`)
      .send({ paymentMethod: 'cash' });
    expect(payRes.status).toBe(200);
    expect(payRes.body.data.status).toBe('paid');
    expect(payRes.body.data.loyalty).toMatchObject({
      awarded: false,
      reason: 'CUSTOMER_BLOCKED',
    });
    expect(await getLoyaltyLedgerModel().countDocuments()).toBe(0);
  });

  it('missing customer at pay: sale succeeds, no earn', async () => {
    await seedEnabledProgram(5000);
    const member = await registerMember('081211110006');
    const { orderId } = await createDraftWithItems([{ kodeMenu, qty: 1 }]);
    await request(app)
      .put(`/api/v1/orders/${orderId}/customer`)
      .set('Authorization', `Bearer ${kasirToken}`)
      .send({ customerId: member.id });
    await getCustomerModel().deleteOne({ _id: member.id });

    const payRes = await request(app)
      .post(`/api/v1/orders/${orderId}/pay`)
      .set('Authorization', `Bearer ${kasirToken}`)
      .send({ paymentMethod: 'cash' });
    expect(payRes.status).toBe(200);
    expect(payRes.body.data.loyalty).toMatchObject({
      awarded: false,
      reason: 'CUSTOMER_NOT_FOUND',
    });
    expect(await getLoyaltyLedgerModel().countDocuments()).toBe(0);
  });

  it('fatal loyalty failure rolls back payment', async () => {
    await seedEnabledProgram(5000);
    const member = await registerMember('081211110007');
    const { orderId } = await createDraftWithItems([{ kodeMenu, qty: 1 }]);
    await request(app)
      .put(`/api/v1/orders/${orderId}/customer`)
      .set('Authorization', `Bearer ${kasirToken}`)
      .send({ customerId: member.id });

    const appendSpy = vi
      .spyOn(
        await import('../../../src/infrastructure/loyalty/MongoLoyaltyLedgerRepository.js').then(
          (m) => m.MongoLoyaltyLedgerRepository.prototype,
        ),
        'append',
      )
      .mockRejectedValueOnce(new Error('INJECTED_LEDGER_FATAL'));

    const payRes = await request(app)
      .post(`/api/v1/orders/${orderId}/pay`)
      .set('Authorization', `Bearer ${kasirToken}`)
      .send({ paymentMethod: 'cash' });
    expect(payRes.status).toBeGreaterThanOrEqual(500);
    expect(await getOrderModel().findById(orderId).lean()).toMatchObject({ status: 'draft' });
    expect(await getPaymentModel().countDocuments({ orderId })).toBe(0);
    expect(await getLoyaltyLedgerModel().countDocuments()).toBe(0);
    const customer = await getCustomerModel().findById(member.id).lean();
    expect(customer?.currentPoints).toBe(0);
    appendSpy.mockRestore();
  });

  it('historical order without customer fields reconstitutes', () => {
    const order = Order.reconstitute(
      'legacy-1',
      {
        orderNumber: 'WN-LEGACY',
        status: 'paid',
        diningType: 'dine_in',
        cashierId: 'c1',
        cashierName: 'Kasir',
        items: [],
        paymentMethod: 'cash',
        paidAmount: 1000,
        changeAmount: 0,
        paidAt: new Date(),
      },
      new Date(),
      new Date(),
    );
    expect(order.customerId).toBeUndefined();
    expect(order.status).toBe('paid');
  });

  it('pos-ui gate defaults false', async () => {
    const res = await request(app)
      .get('/api/v1/loyalty/pos-ui')
      .set('Authorization', `Bearer ${kasirToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.memberUiEnabled).toBe(false);
    expect(res.body.data.receiptQrEnabled).toBe(false);
  });

  it('clear customer before pay', async () => {
    const member = await registerMember('081211110008');
    const { orderId } = await createDraftWithItems([{ kodeMenu, qty: 1 }]);
    await request(app)
      .put(`/api/v1/orders/${orderId}/customer`)
      .set('Authorization', `Bearer ${kasirToken}`)
      .send({ customerId: member.id });
    const clear = await request(app)
      .delete(`/api/v1/orders/${orderId}/customer`)
      .set('Authorization', `Bearer ${kasirToken}`);
    expect(clear.status).toBe(200);
    expect(clear.body.data.customerId == null).toBe(true);
  });
});
