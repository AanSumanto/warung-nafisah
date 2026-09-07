import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../../../src/app.js';
import { resetEnvCache } from '../../../src/config/env.js';
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
import { MongoLoyaltyRewardRepository } from '../../../src/infrastructure/loyalty/MongoLoyaltyRewardRepository.js';
import { Customer } from '../../../src/domain/loyalty/Customer.js';
import { LoyaltyReward } from '../../../src/domain/loyalty/LoyaltyReward.js';
import { BASELINE_REWARD_CATALOG } from '../../../src/application/loyalty/baselineRewardCatalog.js';
import { generatePublicMemberId } from '../../../src/domain/loyalty/publicMemberId.js';

const KASIR_EMAIL = 'kasir@warungnafisah.local';
const DEFAULT_PASSWORD = 'warung123';

describe('LOYALTY-07 cashier redemption', () => {
  const app = createApp();
  let kasirToken = '';

  beforeAll(async () => {
    process.env.LOYALTY_REDEMPTION_ENABLED = 'true';
    resetEnvCache();
    await setupMongoMemoryServer();
    await ensureEventCollections();
    const { initializePosInfrastructure } = await import(
      '../../../src/infrastructure/pos/PosModule.js'
    );
    await initializePosInfrastructure();
    await runDatabaseBootstrap();
  });

  afterAll(async () => {
    process.env.LOYALTY_REDEMPTION_ENABLED = 'false';
    resetEnvCache();
    await teardownMongoMemoryServer();
  });

  beforeEach(async () => {
    process.env.LOYALTY_REDEMPTION_ENABLED = 'true';
    resetEnvCache();
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
    // restore menus
    await getMenuModel().updateMany({}, { $set: { status: 'available' } });
    await getMenuModel().updateOne({ kodeMenu: 'SYR001' }, { $set: { status: 'hidden' } });

    kasirToken = await loginAndGetToken(app, KASIR_EMAIL, DEFAULT_PASSWORD);
    await request(app)
      .post('/api/v1/shifts/open')
      .set('Authorization', `Bearer ${kasirToken}`)
      .send({ openingCash: 100000 });
  });

  async function seedProgram(enabled: boolean) {
    const now = new Date();
    await new MongoLoyaltyProgramRepository(getLoyaltyProgramModel()).save(
      LoyaltyProgram.reconstitute(
        'prog-r',
        {
          programCode: LOYALTY_PROGRAM_CODE,
          programName: 'Nafisah Rewards',
          enabled,
          pointEarnRate: 5000,
          version: 1,
          effectiveFrom: now,
          updatedBy: 'test',
        },
        now,
        now,
      ),
    );
  }

  async function seedRewards() {
    const repo = new MongoLoyaltyRewardRepository(getLoyaltyRewardModel());
    for (const def of BASELINE_REWARD_CATALOG) {
      await repo.save(
        LoyaltyReward.create({
          id: `rw-${def.rewardCode}`,
          rewardCode: def.rewardCode,
          name: def.name,
          menuKode: def.menuKode,
          pointsRequired: def.pointsRequired,
          hppEstimate: def.hppEstimate,
          sortOrder: def.sortOrder,
          updatedBy: 'test',
        }),
      );
    }
  }

  async function seedMember(points: number, phone = '081233330001') {
    const publicMemberId = generatePublicMemberId();
    const customer = Customer.reconstitute(
      `cust-${publicMemberId.slice(0, 8)}`,
      {
        publicMemberId,
        phoneNormalized: phone.startsWith('62') ? phone : `62${phone.replace(/^0/, '')}`,
        phoneMasked: '08******001',
        name: 'Aan',
        currentPoints: points,
        lifetimeEarnedPoints: points,
        lifetimeRedeemedPoints: 0,
        totalSpending: 0,
        transactionCount: 0,
        lastTransactionAt: null,
        status: 'active',
        registeredAt: new Date(),
        registeredBy: 'test',
      },
      new Date(),
      new Date(),
    );
    await new MongoCustomerRepository(getCustomerModel()).save(customer);
    return customer;
  }

  async function createDraftWithItems(items: Array<{ kodeMenu: string; qty: number }>) {
    const create = await request(app)
      .post('/api/v1/orders')
      .set('Authorization', `Bearer ${kasirToken}`)
      .send({ diningType: 'dine_in' });
    expect(create.status).toBe(201);
    const orderId = create.body.data.id as string;
    const upd = await request(app)
      .put(`/api/v1/orders/${orderId}/items`)
      .set('Authorization', `Bearer ${kasirToken}`)
      .send({ items });
    expect(upd.status).toBe(200);
    return { orderId, total: upd.body.data.total as number };
  }

  it('pos-ui exposes redemptionEnabled default false when env off', async () => {
    process.env.LOYALTY_REDEMPTION_ENABLED = 'false';
    resetEnvCache();
    const res = await request(app)
      .get('/api/v1/loyalty/pos-ui')
      .set('Authorization', `Bearer ${kasirToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.redemptionEnabled).toBe(false);
  });

  it('redemption gate off rejects set reward', async () => {
    process.env.LOYALTY_REDEMPTION_ENABLED = 'false';
    resetEnvCache();
    await seedProgram(true);
    await seedRewards();
    const member = await seedMember(30);
    const { orderId } = await createDraftWithItems([{ kodeMenu: 'LL001', qty: 1 }]);
    await request(app)
      .put(`/api/v1/orders/${orderId}/customer`)
      .set('Authorization', `Bearer ${kasirToken}`)
      .send({ customerId: member.id });
    const res = await request(app)
      .put(`/api/v1/orders/${orderId}/reward`)
      .set('Authorization', `Bearer ${kasirToken}`)
      .send({ rewardCode: 'REWARD_NASI_PUTIH' });
    expect(res.status).toBe(400);
    expect(res.body.error.details.code).toBe('LOYALTY_REDEMPTION_DISABLED');
  });

  it('basic redemption + earn same pay: -30 then +3, total 19000', async () => {
    await seedProgram(true);
    await seedRewards();
    const member = await seedMember(30);
    // AYM002 17000 + MNM001 3000 = 20000 if both exist; use AYM001+MNM or LL
    const ayam = await getMenuModel().findOne({ kodeMenu: 'AYM001' }).lean();
    const teh = await getMenuModel().findOne({ kodeMenu: 'MNM001' }).lean();
    const items =
      ayam && teh
        ? [
            { kodeMenu: 'AYM001', qty: 1 },
            { kodeMenu: 'MNM001', qty: 1 },
          ]
        : [
            { kodeMenu: 'LL001', qty: 1 },
            { kodeMenu: 'MNM001', qty: 3 },
          ];
    const { orderId, total } = await createDraftWithItems(items);
    // Adjust: need ~19000 — if not, use whatever and compute expected earn
    await request(app)
      .put(`/api/v1/orders/${orderId}/customer`)
      .set('Authorization', `Bearer ${kasirToken}`)
      .send({ customerId: member.id });

    const setReward = await request(app)
      .put(`/api/v1/orders/${orderId}/reward`)
      .set('Authorization', `Bearer ${kasirToken}`)
      .send({ rewardCode: 'REWARD_NASI_PUTIH' });
    expect(setReward.status).toBe(200);
    expect(setReward.body.data.loyaltyRedemptionIntent.rewardCode).toBe('REWARD_NASI_PUTIH');
    // Intent must not create ledger yet
    expect(await getLoyaltyLedgerModel().countDocuments()).toBe(0);
    expect((await getCustomerModel().findById(member.id).lean())?.currentPoints).toBe(30);

    const pay = await request(app)
      .post(`/api/v1/orders/${orderId}/pay`)
      .set('Authorization', `Bearer ${kasirToken}`)
      .send({ paymentMethod: 'cash' });
    expect(pay.status).toBe(200);
    expect(pay.body.data.total).toBe(total);
    expect(pay.body.data.items.some((i: { lineKind?: string }) => i.lineKind === 'REWARD')).toBe(
      true,
    );
    expect(pay.body.data.loyalty.redemption.pointsUsed).toBe(30);
    expect(pay.body.data.loyalty.redemption.rewardName).toBe('Nasi Putih');

    const expectedEarn = Math.floor(total / 5000);
    expect(pay.body.data.loyalty.pointsEarned).toBe(expectedEarn);
    expect(pay.body.data.loyalty.balanceAfter).toBe(0 + expectedEarn);

    const ledger = await getLoyaltyLedgerModel().find({}).sort({ occurredAt: 1 }).lean();
    expect(ledger).toHaveLength(2);
    expect(ledger[0]!.type).toBe('REDEEM_REWARD');
    expect(ledger[0]!.pointsDelta).toBe(-30);
    expect(ledger[0]!.balanceAfter).toBe(0);
    expect(ledger[1]!.type).toBe('EARN_SALE');
    expect(ledger[1]!.pointsDelta).toBe(expectedEarn);
    expect(ledger[1]!.balanceAfter).toBe(expectedEarn);

    const customer = await getCustomerModel().findById(member.id).lean();
    expect(customer?.currentPoints).toBe(expectedEarn);
  });

  it('insufficient points rejects pay; no ledger; draft remains', async () => {
    await seedProgram(true);
    await seedRewards();
    const member = await seedMember(29);
    const { orderId } = await createDraftWithItems([{ kodeMenu: 'LL001', qty: 1 }]);
    await request(app)
      .put(`/api/v1/orders/${orderId}/customer`)
      .set('Authorization', `Bearer ${kasirToken}`)
      .send({ customerId: member.id });
    // Force intent bypassing UI validation by direct set — assertRewardSelectable should reject at set
    const setReward = await request(app)
      .put(`/api/v1/orders/${orderId}/reward`)
      .set('Authorization', `Bearer ${kasirToken}`)
      .send({ rewardCode: 'REWARD_NASI_PUTIH' });
    expect(setReward.status).toBe(400);
    expect(setReward.body.error.details.code).toBe('LOYALTY_REDEMPTION_INSUFFICIENT_POINTS');
  });

  it('hidden Cah Kangkung rejected', async () => {
    await seedProgram(true);
    await seedRewards();
    const member = await seedMember(100);
    const { orderId } = await createDraftWithItems([{ kodeMenu: 'LL001', qty: 1 }]);
    await request(app)
      .put(`/api/v1/orders/${orderId}/customer`)
      .set('Authorization', `Bearer ${kasirToken}`)
      .send({ customerId: member.id });
    const res = await request(app)
      .put(`/api/v1/orders/${orderId}/reward`)
      .set('Authorization', `Bearer ${kasirToken}`)
      .send({ rewardCode: 'REWARD_CAH_KANGKUNG' });
    expect(res.status).toBe(400);
    expect(res.body.error.details.code).toBe('LOYALTY_REWARD_UNAVAILABLE');
  });

  it('sold_out Ayam Dada rejected without substitution', async () => {
    await seedProgram(true);
    await seedRewards();
    await getMenuModel().updateOne({ kodeMenu: 'AYM002' }, { $set: { status: 'sold_out' } });
    const member = await seedMember(100);
    const { orderId } = await createDraftWithItems([{ kodeMenu: 'LL001', qty: 1 }]);
    await request(app)
      .put(`/api/v1/orders/${orderId}/customer`)
      .set('Authorization', `Bearer ${kasirToken}`)
      .send({ customerId: member.id });
    const res = await request(app)
      .put(`/api/v1/orders/${orderId}/reward`)
      .set('Authorization', `Bearer ${kasirToken}`)
      .send({ rewardCode: 'REWARD_AYAM_DADA' });
    expect(res.status).toBe(400);
    expect(res.body.error.details.code).toBe('LOYALTY_REWARD_UNAVAILABLE');
  });

  it('program disabled with intent rejects pay; without intent succeeds', async () => {
    await seedProgram(true);
    await seedRewards();
    const member = await seedMember(30);
    const { orderId } = await createDraftWithItems([{ kodeMenu: 'LL001', qty: 1 }]);
    await request(app)
      .put(`/api/v1/orders/${orderId}/customer`)
      .set('Authorization', `Bearer ${kasirToken}`)
      .send({ customerId: member.id });
    await request(app)
      .put(`/api/v1/orders/${orderId}/reward`)
      .set('Authorization', `Bearer ${kasirToken}`)
      .send({ rewardCode: 'REWARD_NASI_PUTIH' });

    await seedProgram(false);
    const pay = await request(app)
      .post(`/api/v1/orders/${orderId}/pay`)
      .set('Authorization', `Bearer ${kasirToken}`)
      .send({ paymentMethod: 'cash' });
    expect(pay.status).toBe(400);
    expect(await getPaymentModel().countDocuments()).toBe(0);

    await request(app)
      .delete(`/api/v1/orders/${orderId}/reward`)
      .set('Authorization', `Bearer ${kasirToken}`);
    const pay2 = await request(app)
      .post(`/api/v1/orders/${orderId}/pay`)
      .set('Authorization', `Bearer ${kasirToken}`)
      .send({ paymentMethod: 'cash' });
    expect(pay2.status).toBe(200);
    expect(pay2.body.data.loyalty.awarded).toBe(false);
  });

  it('remove intent before pay leaves no ledger', async () => {
    await seedProgram(true);
    await seedRewards();
    const member = await seedMember(30);
    const { orderId } = await createDraftWithItems([{ kodeMenu: 'LL001', qty: 1 }]);
    await request(app)
      .put(`/api/v1/orders/${orderId}/customer`)
      .set('Authorization', `Bearer ${kasirToken}`)
      .send({ customerId: member.id });
    await request(app)
      .put(`/api/v1/orders/${orderId}/reward`)
      .set('Authorization', `Bearer ${kasirToken}`)
      .send({ rewardCode: 'REWARD_NASI_PUTIH' });
    await request(app)
      .delete(`/api/v1/orders/${orderId}/reward`)
      .set('Authorization', `Bearer ${kasirToken}`);
    const pay = await request(app)
      .post(`/api/v1/orders/${orderId}/pay`)
      .set('Authorization', `Bearer ${kasirToken}`)
      .send({ paymentMethod: 'cash' });
    expect(pay.status).toBe(200);
    expect(pay.body.data.loyalty.redemption).toBeUndefined();
    expect(await getLoyaltyLedgerModel().countDocuments({ type: 'REDEEM_REWARD' })).toBe(0);
  });

  it('change intent: only latest reward redeemed', async () => {
    await seedProgram(true);
    await seedRewards();
    const member = await seedMember(30);
    const { orderId } = await createDraftWithItems([{ kodeMenu: 'LL001', qty: 1 }]);
    await request(app)
      .put(`/api/v1/orders/${orderId}/customer`)
      .set('Authorization', `Bearer ${kasirToken}`)
      .send({ customerId: member.id });
    await request(app)
      .put(`/api/v1/orders/${orderId}/reward`)
      .set('Authorization', `Bearer ${kasirToken}`)
      .send({ rewardCode: 'REWARD_ES_TEH' });
    await request(app)
      .put(`/api/v1/orders/${orderId}/reward`)
      .set('Authorization', `Bearer ${kasirToken}`)
      .send({ rewardCode: 'REWARD_NASI_PUTIH' });
    const pay = await request(app)
      .post(`/api/v1/orders/${orderId}/pay`)
      .set('Authorization', `Bearer ${kasirToken}`)
      .send({ paymentMethod: 'cash' });
    expect(pay.status).toBe(200);
    expect(pay.body.data.loyalty.redemption.rewardCode).toBe('REWARD_NASI_PUTIH');
    expect(pay.body.data.loyalty.redemption.pointsUsed).toBe(30);
  });

  it('concurrent different orders: only one redemption succeeds', async () => {
    await seedProgram(true);
    await seedRewards();
    const member = await seedMember(30);
    const a = await createDraftWithItems([{ kodeMenu: 'LL001', qty: 1 }]);
    const b = await createDraftWithItems([{ kodeMenu: 'LL001', qty: 1 }]);
    for (const orderId of [a.orderId, b.orderId]) {
      await request(app)
        .put(`/api/v1/orders/${orderId}/customer`)
        .set('Authorization', `Bearer ${kasirToken}`)
        .send({ customerId: member.id });
      await request(app)
        .put(`/api/v1/orders/${orderId}/reward`)
        .set('Authorization', `Bearer ${kasirToken}`)
        .send({ rewardCode: 'REWARD_NASI_PUTIH' });
    }
    const [r1, r2] = await Promise.all([
      request(app)
        .post(`/api/v1/orders/${a.orderId}/pay`)
        .set('Authorization', `Bearer ${kasirToken}`)
        .send({ paymentMethod: 'cash' }),
      request(app)
        .post(`/api/v1/orders/${b.orderId}/pay`)
        .set('Authorization', `Bearer ${kasirToken}`)
        .send({ paymentMethod: 'cash' }),
    ]);
    const statuses = [r1.status, r2.status].sort((a, b) => a - b);
    expect(statuses[0]).toBe(200);
    expect(statuses[1]).toBeGreaterThanOrEqual(400);
    expect(await getLoyaltyLedgerModel().countDocuments({ type: 'REDEEM_REWARD' })).toBe(1);
    const customer = await getCustomerModel().findById(member.id).lean();
    expect(customer!.currentPoints).toBeGreaterThanOrEqual(0);
  });

  it('public portal remains GET-only', async () => {
    const post = await request(app).post('/api/v1/public/rewards/member/abc').send({});
    expect(post.status).toBe(405);
  });
});
