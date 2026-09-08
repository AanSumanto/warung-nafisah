import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../../../src/app.js';
import {
  setupMongoMemoryServer,
  teardownMongoMemoryServer,
} from '../../helpers/persistence/mongo-memory.js';
import { loginAndGetToken } from '../../helpers/auth/login.js';
import { ensureEventCollections } from '../../../src/infrastructure/events/EventPlatformFactory.js';
import { runDatabaseBootstrap } from '../../../src/infrastructure/database/bootstrap/runDatabaseBootstrap.js';
import { getCustomerModel } from '../../../src/infrastructure/loyalty/documents/CustomerDocument.js';
import { getLoyaltyLedgerModel } from '../../../src/infrastructure/loyalty/documents/LoyaltyLedgerDocument.js';
import { getLoyaltyProgramModel } from '../../../src/infrastructure/loyalty/documents/LoyaltyProgramDocument.js';
import { getOrderModel } from '../../../src/infrastructure/pos/documents/OrderDocument.js';
import { resetEnvCache } from '../../../src/config/env.js';
import { Customer } from '../../../src/domain/loyalty/Customer.js';
import { LoyaltyProgram } from '../../../src/domain/loyalty/LoyaltyProgram.js';
import { LoyaltyLedgerEntry } from '../../../src/domain/loyalty/LoyaltyLedgerEntry.js';
import { LOYALTY_PROGRAM_CODE } from '../../../src/domain/loyalty/LoyaltyTypes.js';
import { createLoyaltyModule, initializeLoyaltyInfrastructure } from '../../../src/infrastructure/loyalty/LoyaltyModule.js';
import { generatePublicMemberId } from '../../../src/domain/loyalty/publicMemberId.js';

const KASIR_EMAIL = 'kasir@warungnafisah.local';
const OWNER_EMAIL = 'owner@warungnafisah.local';
const DEFAULT_PASSWORD = 'warung123';

const snapshot = {
  programCode: LOYALTY_PROGRAM_CODE,
  programVersion: 1,
  pointEarnRate: 5000,
};

describe('LOYALTY-09 admin analytics + manual adjustment', () => {
  const app = createApp();
  let kasirToken = '';
  let ownerToken = '';

  beforeAll(async () => {
    process.env.LOYALTY_ADMIN_ADJUSTMENT_ENABLED = 'true';
    resetEnvCache();
    await setupMongoMemoryServer();
    await ensureEventCollections();
    const { initializePosInfrastructure } = await import(
      '../../../src/infrastructure/pos/PosModule.js'
    );
    await initializePosInfrastructure();
    await initializeLoyaltyInfrastructure();
    await runDatabaseBootstrap();
  });

  afterAll(async () => {
    process.env.LOYALTY_ADMIN_ADJUSTMENT_ENABLED = 'false';
    resetEnvCache();
    await teardownMongoMemoryServer();
  });

  beforeEach(async () => {
    process.env.LOYALTY_ADMIN_ADJUSTMENT_ENABLED = 'true';
    resetEnvCache();
    await Promise.all([
      getCustomerModel().deleteMany({}),
      getLoyaltyLedgerModel().collection.deleteMany({}),
      getOrderModel().deleteMany({}),
    ]);
    // keep program from bootstrap
    kasirToken = await loginAndGetToken(app, KASIR_EMAIL, DEFAULT_PASSWORD);
    ownerToken = await loginAndGetToken(app, OWNER_EMAIL, DEFAULT_PASSWORD);
  });

  async function seedCustomer(points: number, phone = '081299990001', name = 'Aan') {
    const id = `cust-${phone.slice(-4)}`;
    const publicMemberId = generatePublicMemberId();
    const now = new Date();
    const customer = Customer.reconstitute(
      id,
      {
        publicMemberId,
        phoneNormalized: `62${phone.replace(/^0/, '')}`,
        phoneMasked: '0812******01',
        name,
        currentPoints: points,
        lifetimeEarnedPoints: Math.max(0, points),
        lifetimeRedeemedPoints: 0,
        totalSpending: 0,
        transactionCount: 0,
        lastTransactionAt: null,
        status: 'active',
        registeredAt: now,
        registeredBy: 'test',
      },
      now,
      now,
    );
    await getCustomerModel().create({
      _id: id,
      ...customer.toRecord(),
      createdAt: now,
      updatedAt: now,
    });
    return { id, publicMemberId };
  }

  it('positive adjustment +10', async () => {
    const { id } = await seedCustomer(20);
    const res = await request(app)
      .post(`/api/v1/admin/loyalty/customers/${id}/adjustments`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        pointsDelta: 10,
        reason: 'Koreksi poin',
        requestId: 'req-pos-0001',
      });
    expect(res.status).toBe(201);
    expect(res.body.data.balanceAfter).toBe(30);
    expect(res.body.data.pointsDelta).toBe(10);

    const ledger = await getLoyaltyLedgerModel().find({ customerId: id }).lean();
    expect(ledger).toHaveLength(1);
    expect(ledger[0]!.type).toBe('MANUAL_ADJUSTMENT');
  });

  it('negative adjustment may go negative', async () => {
    const { id } = await seedCustomer(5);
    const res = await request(app)
      .post(`/api/v1/admin/loyalty/customers/${id}/adjustments`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        pointsDelta: -10,
        reason: 'Koreksi over-credit',
        requestId: 'req-neg-0001',
      });
    expect(res.status).toBe(201);
    expect(res.body.data.balanceAfter).toBe(-5);
  });

  it('idempotent same requestId', async () => {
    const { id } = await seedCustomer(10);
    const body = {
      pointsDelta: 5,
      reason: 'Bonus',
      requestId: 'req-idem-0001',
    };
    const first = await request(app)
      .post(`/api/v1/admin/loyalty/customers/${id}/adjustments`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send(body);
    const second = await request(app)
      .post(`/api/v1/admin/loyalty/customers/${id}/adjustments`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send(body);
    expect(first.status).toBe(201);
    expect(second.status).toBe(200);
    expect(second.body.data.alreadyProcessed).toBe(true);
    expect(second.body.data.adjustmentId).toBe(first.body.data.adjustmentId);
    const count = await getLoyaltyLedgerModel().countDocuments({ customerId: id });
    expect(count).toBe(1);
    const cust = await getCustomerModel().findById(id).lean();
    expect(cust!.currentPoints).toBe(15);
  });

  it('two intentional identical adjustments with different requestId', async () => {
    const { id } = await seedCustomer(0);
    for (const requestId of ['req-twin-a001', 'req-twin-b001']) {
      const res = await request(app)
        .post(`/api/v1/admin/loyalty/customers/${id}/adjustments`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ pointsDelta: 10, reason: 'Sama sengaja', requestId });
      expect(res.status).toBe(201);
    }
    const cust = await getCustomerModel().findById(id).lean();
    expect(cust!.currentPoints).toBe(20);
    expect(await getLoyaltyLedgerModel().countDocuments({ customerId: id })).toBe(2);
  });

  it('rejects empty reason', async () => {
    const { id } = await seedCustomer(10);
    const res = await request(app)
      .post(`/api/v1/admin/loyalty/customers/${id}/adjustments`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ pointsDelta: 1, reason: '  ', requestId: 'req-noreason01' });
    expect(res.status).toBe(400);
    expect(await getLoyaltyLedgerModel().countDocuments({})).toBe(0);
  });

  it('kasir forbidden 403', async () => {
    const { id } = await seedCustomer(10);
    const res = await request(app)
      .post(`/api/v1/admin/loyalty/customers/${id}/adjustments`)
      .set('Authorization', `Bearer ${kasirToken}`)
      .send({ pointsDelta: 1, reason: 'Hack', requestId: 'req-kasir-0001' });
    expect(res.status).toBe(403);
  });

  it('gate off rejects', async () => {
    process.env.LOYALTY_ADMIN_ADJUSTMENT_ENABLED = 'false';
    resetEnvCache();
    const { id } = await seedCustomer(10);
    const res = await request(app)
      .post(`/api/v1/admin/loyalty/customers/${id}/adjustments`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ pointsDelta: 1, reason: 'Off', requestId: 'req-gate-off01' });
    expect(res.status).toBe(400);
    expect(res.body.error.details?.code).toBe('LOYALTY_ADMIN_ADJUSTMENT_DISABLED');
  });

  it('concurrent +10 and -5 from 20 → 25', async () => {
    const { id } = await seedCustomer(20);
    const results = await Promise.all([
      request(app)
        .post(`/api/v1/admin/loyalty/customers/${id}/adjustments`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ pointsDelta: 10, reason: 'A', requestId: 'req-conc-a001' }),
      request(app)
        .post(`/api/v1/admin/loyalty/customers/${id}/adjustments`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ pointsDelta: -5, reason: 'B', requestId: 'req-conc-b001' }),
    ]);
    expect(results.every((r) => r.status === 201 || r.status === 200)).toBe(true);
    const cust = await getCustomerModel().findById(id).lean();
    expect(cust!.currentPoints).toBe(25);
  });

  it('dashboard aggregates fixture ledger correctly', async () => {
    const now = new Date();
    await seedCustomer(0, '081211110001', 'A');
    // Seed ledger rows directly
    const rows = [
      { type: 'EARN_SALE' as const, delta: 10, id: 'e1' },
      { type: 'EARN_SALE' as const, delta: 5, id: 'e2' },
      { type: 'REDEEM_REWARD' as const, delta: -10, id: 'r1' },
      { type: 'REVERSAL_REFUND' as const, delta: -5, id: 'v1' },
      { type: 'MANUAL_ADJUSTMENT' as const, delta: 3, id: 'm1' },
    ];
    for (const row of rows) {
      if (row.type === 'EARN_SALE') {
        await getLoyaltyLedgerModel().collection.insertOne({
          _id: row.id,
          customerId: 'cust-0001',
          type: row.type,
          pointsDelta: row.delta,
          balanceAfter: 0,
          sourceType: 'SALE',
          sourceId: row.id,
          idempotencyKey: `k-${row.id}`,
          programSnapshot: snapshot,
          metadata: {
            kind: 'EARN_SALE',
            eligiblePaidAmount: row.delta * 5000,
            orderId: row.id,
            calculationVersion: 'v1',
          },
          actor: { type: 'SYSTEM' },
          occurredAt: now,
          createdAt: now,
          updatedAt: now,
        });
      } else if (row.type === 'REDEEM_REWARD') {
        await getLoyaltyLedgerModel().collection.insertOne({
          _id: row.id,
          customerId: 'cust-0001',
          type: row.type,
          pointsDelta: row.delta,
          balanceAfter: 0,
          sourceType: 'REWARD_REDEMPTION',
          sourceId: row.id,
          idempotencyKey: `k-${row.id}`,
          programSnapshot: snapshot,
          metadata: {
            kind: 'REDEEM_REWARD',
            orderId: row.id,
            rewardCode: 'REWARD_ES_TEH',
            rewardName: 'Es Teh',
            pointsRequired: 10,
            menuKode: 'ESTEH',
            rewardHppSnapshot: 1500,
          },
          actor: { type: 'SYSTEM' },
          occurredAt: now,
          createdAt: now,
          updatedAt: now,
        });
      } else if (row.type === 'REVERSAL_REFUND') {
        await getLoyaltyLedgerModel().collection.insertOne({
          _id: row.id,
          customerId: 'cust-0001',
          type: row.type,
          pointsDelta: row.delta,
          balanceAfter: 0,
          sourceType: 'REFUND',
          sourceId: row.id,
          idempotencyKey: `k-${row.id}`,
          programSnapshot: snapshot,
          metadata: {
            kind: 'REVERSAL_REFUND',
            originalLedgerEntryId: 'e1',
            originalOrderId: 'o1',
            pointsReversed: 5,
          },
          actor: { type: 'SYSTEM' },
          occurredAt: now,
          createdAt: now,
          updatedAt: now,
        });
      } else {
        await getLoyaltyLedgerModel().collection.insertOne({
          _id: row.id,
          customerId: 'cust-0001',
          type: row.type,
          pointsDelta: row.delta,
          balanceAfter: 0,
          sourceType: 'MANUAL',
          sourceId: row.id,
          idempotencyKey: `k-${row.id}`,
          programSnapshot: snapshot,
          metadata: {
            kind: 'MANUAL_ADJUSTMENT',
            reason: 'fix',
            requestId: row.id,
          },
          actor: { type: 'USER', userId: 'owner' },
          occurredAt: now,
          createdAt: now,
          updatedAt: now,
        });
      }
    }

    // Add more redeem HPP snapshots 3000 + 7000
    await getLoyaltyLedgerModel().collection.insertMany([
      {
        _id: 'r2',
        customerId: 'cust-0001',
        type: 'REDEEM_REWARD',
        pointsDelta: -30,
        balanceAfter: 0,
        sourceType: 'REWARD_REDEMPTION',
        sourceId: 'r2',
        idempotencyKey: 'k-r2',
        programSnapshot: snapshot,
        metadata: {
          kind: 'REDEEM_REWARD',
          orderId: 'r2',
          rewardCode: 'REWARD_NASI',
          rewardName: 'Nasi',
          pointsRequired: 30,
          menuKode: 'NASI',
          rewardHppSnapshot: 3000,
        },
        actor: { type: 'SYSTEM' },
        occurredAt: now,
        createdAt: now,
        updatedAt: now,
      },
      {
        _id: 'r3',
        customerId: 'cust-0001',
        type: 'REDEEM_REWARD',
        pointsDelta: -75,
        balanceAfter: 0,
        sourceType: 'REWARD_REDEMPTION',
        sourceId: 'r3',
        idempotencyKey: 'k-r3',
        programSnapshot: snapshot,
        metadata: {
          kind: 'REDEEM_REWARD',
          orderId: 'r3',
          rewardCode: 'REWARD_LELE',
          rewardName: 'Lele',
          pointsRequired: 75,
          menuKode: 'LELE',
          rewardHppSnapshot: 7000,
        },
        actor: { type: 'SYSTEM' },
        occurredAt: now,
        createdAt: now,
        updatedAt: now,
      },
    ]);

    const res = await request(app)
      .get('/api/v1/admin/loyalty/dashboard')
      .query({ preset: '30d' })
      .set('Authorization', `Bearer ${ownerToken}`);
    expect(res.status).toBe(200);
    const p = res.body.data.points;
    expect(p.earnedInRange).toBe(15);
    expect(p.redeemedInRange).toBe(115); // 10+30+75
    expect(p.reversedInRange).toBe(5);
    expect(p.manualPositiveInRange).toBe(3);
    expect(res.body.data.cost.rewardHppCostInRange).toBe(11500);
  });

  it('outstanding splits positive and negative deficit', async () => {
    await seedCustomer(20, '081200000020');
    await seedCustomer(10, '081200000010');
    await seedCustomer(-5, '081200000005');
    // fix ids - seedCustomer uses last 4 digits
    const res = await request(app)
      .get('/api/v1/admin/loyalty/dashboard')
      .query({ preset: '30d' })
      .set('Authorization', `Bearer ${ownerToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.points.netOutstanding).toBe(25);
    expect(res.body.data.points.positiveOutstanding).toBe(30);
    expect(res.body.data.points.negativeDeficit).toBe(5);
    expect(res.body.data.members.negativeBalanceCount).toBe(1);
  });

  it('member vs nonmember paid orders only', async () => {
    const now = new Date();
    await getOrderModel().collection.insertMany([
      {
        _id: 'o-m1',
        orderNumber: 'T1',
        status: 'paid',
        total: 20000,
        paidAt: now,
        customerId: 'cust-1',
        createdAt: now,
        updatedAt: now,
        diningType: 'dine_in',
        items: [],
        subtotal: 20000,
        cashierId: 'c',
      },
      {
        _id: 'o-m2',
        orderNumber: 'T2',
        status: 'paid',
        total: 30000,
        paidAt: now,
        customerId: 'cust-1',
        createdAt: now,
        updatedAt: now,
        diningType: 'dine_in',
        items: [],
        subtotal: 30000,
        cashierId: 'c',
      },
      {
        _id: 'o-n1',
        orderNumber: 'T3',
        status: 'paid',
        total: 15000,
        paidAt: now,
        createdAt: now,
        updatedAt: now,
        diningType: 'take_away',
        items: [],
        subtotal: 15000,
        cashierId: 'c',
      },
      {
        _id: 'o-draft',
        orderNumber: 'T4',
        status: 'draft',
        total: 99999,
        customerId: 'cust-1',
        createdAt: now,
        updatedAt: now,
        diningType: 'dine_in',
        items: [],
        subtotal: 99999,
        cashierId: 'c',
      },
    ]);

    const res = await request(app)
      .get('/api/v1/admin/loyalty/dashboard')
      .query({ preset: '30d' })
      .set('Authorization', `Bearer ${ownerToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.sales.memberOrderCount).toBe(2);
    expect(res.body.data.sales.memberSalesAmount).toBe(50000);
    expect(res.body.data.sales.memberAov).toBe(25000);
    expect(res.body.data.sales.nonMemberOrderCount).toBe(1);
    expect(res.body.data.sales.nonMemberAov).toBe(15000);
    expect(res.body.data.repeat.activeMembers).toBe(1);
    expect(res.body.data.repeat.repeatMembers).toBe(1);
    expect(res.body.data.repeat.repeatRatePercent).toBe(100);
  });

  it('repeat rate 2/3 ≈ 66.67', async () => {
    const now = new Date();
    const docs = [];
    // A:2 B:1 C:3
    for (const [cust, n] of [
      ['A', 2],
      ['B', 1],
      ['C', 3],
    ] as const) {
      for (let i = 0; i < n; i++) {
        docs.push({
          _id: `o-${cust}-${i}`,
          orderNumber: `${cust}${i}`,
          status: 'paid',
          total: 10000,
          paidAt: now,
          customerId: cust,
          createdAt: now,
          updatedAt: now,
          diningType: 'dine_in',
          items: [],
          subtotal: 10000,
          cashierId: 'c',
        });
      }
    }
    await getOrderModel().collection.insertMany(docs);
    const res = await request(app)
      .get('/api/v1/admin/loyalty/dashboard')
      .query({ preset: '30d' })
      .set('Authorization', `Bearer ${ownerToken}`);
    expect(res.body.data.repeat.activeMembers).toBe(3);
    expect(res.body.data.repeat.repeatMembers).toBe(2);
    expect(res.body.data.repeat.repeatRatePercent).toBe(66.67);
  });

  it('zero data safe', async () => {
    const res = await request(app)
      .get('/api/v1/admin/loyalty/dashboard')
      .query({ preset: 'today' })
      .set('Authorization', `Bearer ${ownerToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.points.redemptionRatePoints).toBeNull();
    expect(res.body.data.cost.loyaltyCostPercent).toBeNull();
    expect(res.body.data.sales.memberAov).toBeNull();
    expect(Number.isNaN(res.body.data.points.netOutstanding)).toBe(false);
  });

  it('program disabled: analytics still readable', async () => {
    await getLoyaltyProgramModel().updateOne(
      { programCode: LOYALTY_PROGRAM_CODE },
      { $set: { enabled: false } },
    );
    const res = await request(app)
      .get('/api/v1/admin/loyalty/dashboard')
      .query({ preset: '30d' })
      .set('Authorization', `Bearer ${ownerToken}`);
    expect(res.status).toBe(200);
  });

  it('public has no adjustment route', async () => {
    const res = await request(app)
      .post('/api/v1/admin/loyalty/customers/x/adjustments')
      .send({ pointsDelta: 1, reason: 'x', requestId: 'req-pub-00001' });
    expect(res.status).toBe(401);
  });

  it('member detail + ledger + verify', async () => {
    const { id } = await seedCustomer(12, '081288880012', 'Budi');
    await request(app)
      .post(`/api/v1/admin/loyalty/customers/${id}/adjustments`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ pointsDelta: 3, reason: 'Bonus', requestId: 'req-detail-01' });

    const detail = await request(app)
      .get(`/api/v1/admin/loyalty/customers/${id}`)
      .set('Authorization', `Bearer ${ownerToken}`);
    expect(detail.status).toBe(200);
    expect(detail.body.data.currentPoints).toBe(15);
    expect(detail.body.data.totalSpendingLabel).toMatch(/eligible/i);

    const ledger = await request(app)
      .get(`/api/v1/admin/loyalty/customers/${id}/ledger`)
      .set('Authorization', `Bearer ${ownerToken}`);
    expect(ledger.status).toBe(200);
    expect(ledger.body.data.items.length).toBeGreaterThan(0);
    expect(JSON.stringify(ledger.body.data)).not.toMatch(/idempotencyKey/);

    const verify = await request(app)
      .post(`/api/v1/admin/loyalty/customers/${id}/verify-balance`)
      .set('Authorization', `Bearer ${ownerToken}`);
    expect(verify.status).toBe(200);
    expect(['MATCH', 'MISMATCH']).toContain(verify.body.data.status);
  });
});

describe('LOYALTY-09 service rollback', () => {
  beforeAll(async () => {
    process.env.LOYALTY_ADMIN_ADJUSTMENT_ENABLED = 'true';
    resetEnvCache();
    await setupMongoMemoryServer();
    await initializeLoyaltyInfrastructure();
  });

  afterAll(async () => {
    await teardownMongoMemoryServer();
  });

  it('ledger append failure rolls back balance', async () => {
    const module = createLoyaltyModule();
    const now = new Date();
    await getLoyaltyProgramModel().deleteMany({});
    await getLoyaltyProgramModel().create({
      _id: 'prog',
      programCode: LOYALTY_PROGRAM_CODE,
      programName: 'Nafisah Rewards',
      enabled: false,
      pointEarnRate: 5000,
      version: 1,
      effectiveFrom: now,
      updatedBy: 't',
      createdAt: now,
      updatedAt: now,
    });
    await getCustomerModel().deleteMany({});
    await getLoyaltyLedgerModel().collection.deleteMany({});

    const customer = Customer.register({
      id: 'cust-roll',
      phone: '081233334444',
      name: 'Roll',
      registeredBy: 't',
    });
    await module.customerRepository.save(customer);

    const failingLedger = {
      ...module.ledgerRepository,
      append: async () => {
        throw new Error('INJECTED_APPEND_FAIL');
      },
      findByIdempotencyKey: () => module.ledgerRepository.findByIdempotencyKey.bind(module.ledgerRepository),
    };

    // Use real service but monkey-patch via new instance
    const { LoyaltyManualAdjustmentService } = await import(
      '../../../src/application/loyalty/LoyaltyManualAdjustmentService.js'
    );
    const svc = new LoyaltyManualAdjustmentService(
      module.customerRepository,
      {
        append: async () => {
          throw new Error('INJECTED_APPEND_FAIL');
        },
        findByIdempotencyKey: (k: string) => module.ledgerRepository.findByIdempotencyKey(k),
        findById: (id: string) => module.ledgerRepository.findById(id),
        findBySource: (a: string, b: string) => module.ledgerRepository.findBySource(a, b),
        sumPointsDelta: (c: string) => module.ledgerRepository.sumPointsDelta(c),
        listByCustomer: (c: string) => module.ledgerRepository.listByCustomer(c),
        listRecentByCustomer: (c: string, l: number) =>
          module.ledgerRepository.listRecentByCustomer(c, l),
        listPageByCustomer: (i) => module.ledgerRepository.listPageByCustomer(i),
      },
      module.programRepository,
      module.unitOfWork,
    );

    await expect(
      svc.adjust({
        customerId: 'cust-roll',
        pointsDelta: 7,
        reason: 'fail',
        requestId: 'req-fail-0001',
        actorUserId: 'owner-1',
      }),
    ).rejects.toThrow(/INJECTED_APPEND_FAIL/);

    const cust = await getCustomerModel().findById('cust-roll').lean();
    expect(cust!.currentPoints).toBe(0);
  });
});
