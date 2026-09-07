import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import express from 'express';
import rateLimit from 'express-rate-limit';
import request from 'supertest';
import { createApp } from '../../../src/app.js';
import {
  setupMongoMemoryServer,
  teardownMongoMemoryServer,
} from '../../helpers/persistence/mongo-memory.js';
import { ensureEventCollections } from '../../../src/infrastructure/events/EventPlatformFactory.js';
import { runDatabaseBootstrap } from '../../../src/infrastructure/database/bootstrap/runDatabaseBootstrap.js';
import { getCustomerModel } from '../../../src/infrastructure/loyalty/documents/CustomerDocument.js';
import { getLoyaltyProgramModel } from '../../../src/infrastructure/loyalty/documents/LoyaltyProgramDocument.js';
import { getLoyaltyLedgerModel } from '../../../src/infrastructure/loyalty/documents/LoyaltyLedgerDocument.js';
import { getLoyaltyRewardModel } from '../../../src/infrastructure/loyalty/documents/LoyaltyRewardDocument.js';
import { getMenuModel } from '../../../src/infrastructure/pos/documents/MenuDocument.js';
import { LoyaltyProgram } from '../../../src/domain/loyalty/LoyaltyProgram.js';
import { LOYALTY_PROGRAM_CODE } from '../../../src/domain/loyalty/LoyaltyTypes.js';
import { MongoLoyaltyProgramRepository } from '../../../src/infrastructure/loyalty/MongoLoyaltyProgramRepository.js';
import { MongoCustomerRepository } from '../../../src/infrastructure/loyalty/MongoCustomerRepository.js';
import { MongoLoyaltyLedgerRepository } from '../../../src/infrastructure/loyalty/MongoLoyaltyLedgerRepository.js';
import { MongoLoyaltyRewardRepository } from '../../../src/infrastructure/loyalty/MongoLoyaltyRewardRepository.js';
import { Customer } from '../../../src/domain/loyalty/Customer.js';
import { LoyaltyLedgerEntry } from '../../../src/domain/loyalty/LoyaltyLedgerEntry.js';
import { LoyaltyReward } from '../../../src/domain/loyalty/LoyaltyReward.js';
import { BASELINE_REWARD_CATALOG } from '../../../src/application/loyalty/baselineRewardCatalog.js';
import { generatePublicMemberId } from '../../../src/domain/loyalty/publicMemberId.js';
import { LoyaltyLedgerMapper } from '../../../src/infrastructure/loyalty/mappers/LoyaltyLedgerMapper.js';

describe('LOYALTY-06 public member rewards portal API', () => {
  const app = createApp();
  let tokenA = '';
  let customerId = '';

  beforeAll(async () => {
    await setupMongoMemoryServer();
    await ensureEventCollections();
    const { initializePosInfrastructure } = await import(
      '../../../src/infrastructure/pos/PosModule.js'
    );
    await initializePosInfrastructure();
    const { initializeLoyaltyInfrastructure } = await import(
      '../../../src/infrastructure/loyalty/LoyaltyModule.js'
    );
    await initializeLoyaltyInfrastructure();
    await runDatabaseBootstrap();
  });

  afterAll(async () => {
    await teardownMongoMemoryServer();
  });

  beforeEach(async () => {
    await Promise.all([
      getCustomerModel().deleteMany({}),
      getLoyaltyProgramModel().deleteMany({}),
      getLoyaltyLedgerModel().collection.deleteMany({}),
      getLoyaltyRewardModel().deleteMany({}),
    ]);
    tokenA = '';
    customerId = '';
  });

  async function seedProgram(enabled: boolean) {
    const now = new Date();
    const program = LoyaltyProgram.reconstitute(
      'prog-portal',
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
    );
    await new MongoLoyaltyProgramRepository(getLoyaltyProgramModel()).save(program);
  }

  async function seedBaselineRewards() {
    const repo = new MongoLoyaltyRewardRepository(getLoyaltyRewardModel());
    for (const def of BASELINE_REWARD_CATALOG) {
      const reward = LoyaltyReward.create({
        id: `rw-${def.rewardCode}`,
        rewardCode: def.rewardCode,
        name: def.name,
        menuKode: def.menuKode,
        pointsRequired: def.pointsRequired,
        hppEstimate: def.hppEstimate,
        sortOrder: def.sortOrder,
        updatedBy: 'test',
      });
      await repo.save(reward);
    }
  }

  async function seedMember(overrides?: {
    points?: number;
    status?: 'active' | 'blocked';
    name?: string;
    publicMemberId?: string;
  }) {
    const publicMemberId = overrides?.publicMemberId ?? generatePublicMemberId();
    const points = overrides?.points ?? 27;
    const customer = Customer.reconstitute(
      `cust-${publicMemberId.slice(0, 8)}`,
      {
        publicMemberId,
        phoneNormalized: '6281234567890',
        phoneMasked: '08******890',
        name: overrides?.name ?? 'Aan',
        currentPoints: points,
        lifetimeEarnedPoints: points,
        lifetimeRedeemedPoints: 0,
        totalSpending: 135_000,
        transactionCount: 5,
        lastTransactionAt: new Date(),
        status: overrides?.status ?? 'active',
        registeredAt: new Date(),
        registeredBy: 'test',
      },
      new Date(),
      new Date(),
    );
    await new MongoCustomerRepository(getCustomerModel()).save(customer);
    tokenA = publicMemberId;
    customerId = String(customer.id);
    return customer;
  }

  async function seedLedger(entries: Array<{ delta: number; at: Date; id: string }>) {
    const repo = new MongoLoyaltyLedgerRepository(
      getLoyaltyLedgerModel(),
      new LoyaltyLedgerMapper(),
    );
    let balance = 0;
    for (const e of entries) {
      balance += e.delta;
      await repo.append(
        LoyaltyLedgerEntry.createEarnSale({
          id: e.id,
          customerId,
          pointsDelta: e.delta,
          balanceAfter: balance,
          sourceOrderId: `ord-${e.id}`,
          idempotencyKey: `LOYALTY:EARN_SALE:ord-${e.id}`,
          programSnapshot: {
            programCode: LOYALTY_PROGRAM_CODE,
            programVersion: 1,
            pointEarnRate: 5000,
          },
          eligiblePaidAmount: Math.max(0, e.delta) * 5000,
          actor: { type: 'USER', userId: 'kasir-secret' },
          occurredAt: e.at,
        }),
      );
    }
  }

  it('returns current points not receipt snapshot; privacy allowlist', async () => {
    await seedProgram(true);
    await seedBaselineRewards();
    await seedMember({ points: 35, name: 'Aan' });
    // Simulate historical receipt balanceAfter=27 while current is 35
    await getMenuModel().updateOne({ kodeMenu: 'SYR001' }, { $set: { status: 'hidden' } });
    await getMenuModel().updateOne({ kodeMenu: 'AYM002' }, { $set: { status: 'sold_out' } });

    const res = await request(app).get(`/api/v1/public/rewards/member/${tokenA}`);
    expect(res.status).toBe(200);
    expect(res.headers['cache-control']).toMatch(/no-store/i);
    expect(res.body.data.points.current).toBe(35);
    expect(res.body.data.programStatus).toBe('ACTIVE');
    expect(res.body.data.member.phoneMasked).toBe('08******890');
    expect(res.body.data.member.displayName).toBe('Aan');

    const names = (res.body.data.rewards as Array<{ name: string }>).map((r) => r.name);
    expect(names).toContain('Es Teh');
    expect(names).toContain('Ayam Dada');
    expect(names).toContain('Ayam Paha');
    expect(names).not.toContain('Cah Kangkung');

    const dada = res.body.data.rewards.find((r: { name: string }) => r.name === 'Ayam Dada');
    expect(dada.availability).toBe('TEMPORARILY_UNAVAILABLE');
    expect(dada.eligible).toBe(false);

    const esTeh = res.body.data.rewards.find((r: { name: string }) => r.name === 'Es Teh');
    expect(esTeh.eligible).toBe(true);

    const json = JSON.stringify(res.body.data);
    expect(json).not.toMatch(
      /phoneNormalized|6281234567890|totalSpending|transactionCount|idempotencyKey|hppEstimate|HPP|actor|paymentId|eligiblePaidAmount|programSnapshot|_id/,
    );
    expect(json).not.toContain(customerId);
  });

  it('balance 27 progress toward Nasi Putih; duplicate 100 preserved', async () => {
    await seedProgram(true);
    await seedBaselineRewards();
    await seedMember({ points: 27 });
    await getMenuModel().updateOne({ kodeMenu: 'SYR001' }, { $set: { status: 'hidden' } });
    await getMenuModel().updateOne({ kodeMenu: 'AYM002' }, { $set: { status: 'available' } });

    const res = await request(app).get(`/api/v1/public/rewards/member/${tokenA}`);
    expect(res.status).toBe(200);
    expect(res.body.data.progress.nextReward.name).toBe('Nasi Putih');
    expect(res.body.data.progress.nextReward.pointsRemaining).toBe(3);

    const chickens = res.body.data.rewards.filter((r: { pointsRequired: number }) => r.pointsRequired === 100);
    expect(chickens).toHaveLength(2);
  });

  it('hidden next reward skips to Lele at balance 50', async () => {
    await seedProgram(true);
    await seedBaselineRewards();
    await seedMember({ points: 50 });
    await getMenuModel().updateOne({ kodeMenu: 'SYR001' }, { $set: { status: 'hidden' } });

    const res = await request(app).get(`/api/v1/public/rewards/member/${tokenA}`);
    expect(res.body.data.progress.nextReward.name).toBe('Lele');
    expect(res.body.data.progress.nextReward.pointsRemaining).toBe(25);
  });

  it('omits zero-point activity and internal ledger fields', async () => {
    await seedProgram(true);
    await seedBaselineRewards();
    await seedMember({ points: 7 });
    const t0 = new Date('2026-09-07T10:00:00.000Z');
    await seedLedger([
      { delta: 4, at: t0, id: 'e1' },
      { delta: 0, at: new Date(t0.getTime() - 3600_000), id: 'e2' },
      { delta: 3, at: new Date(t0.getTime() - 7200_000), id: 'e3' },
    ]);

    const res = await request(app).get(`/api/v1/public/rewards/member/${tokenA}`);
    expect(res.body.data.recentActivity).toHaveLength(2);
    expect(res.body.data.recentActivity[0].pointsDelta).toBe(4);
    expect(res.body.data.recentActivity[1].pointsDelta).toBe(3);
    expect(JSON.stringify(res.body.data.recentActivity)).not.toMatch(/ord-|kasir-secret|idempotency/);
  });

  it('program disabled returns UNAVAILABLE without redeem CTA', async () => {
    await seedProgram(false);
    await seedBaselineRewards();
    await seedMember({ points: 40 });

    const res = await request(app).get(`/api/v1/public/rewards/member/${tokenA}`);
    expect(res.status).toBe(200);
    expect(res.body.data.programStatus).toBe('UNAVAILABLE');
    expect(res.body.data.points).toBeUndefined();
    expect(res.body.data.rewards).toBeUndefined();
    expect(res.body.data.redemptionHint).toBeUndefined();
    expect(res.body.data.message).toMatch(/belum tersedia/i);
  });

  it('invalid / unknown / blocked tokens return generic 404', async () => {
    await seedProgram(true);
    await seedMember({ status: 'blocked' });
    const blockedToken = tokenA;

    const malformed = await request(app).get('/api/v1/public/rewards/member/not-a-valid-token!!');
    expect(malformed.status).toBe(404);
    expect(malformed.body.error.message).toBe('Member tidak ditemukan');

    const unknown = await request(app).get(
      `/api/v1/public/rewards/member/${generatePublicMemberId()}`,
    );
    expect(unknown.status).toBe(404);
    expect(unknown.body.error.message).toBe('Member tidak ditemukan');

    const blocked = await request(app).get(`/api/v1/public/rewards/member/${blockedToken}`);
    expect(blocked.status).toBe(404);
    expect(blocked.body.error.message).toBe('Member tidak ditemukan');
  });

  it('token rotation invalidates old token', async () => {
    await seedProgram(true);
    await seedBaselineRewards();
    await seedMember({ points: 10 });
    const oldToken = tokenA;

    const first = await request(app).get(`/api/v1/public/rewards/member/${oldToken}`);
    expect(first.status).toBe(200);

    const newToken = generatePublicMemberId();
    await getCustomerModel().updateOne(
      { publicMemberId: oldToken },
      { $set: { publicMemberId: newToken } },
    );

    const stale = await request(app).get(`/api/v1/public/rewards/member/${oldToken}`);
    expect(stale.status).toBe(404);

    const fresh = await request(app).get(`/api/v1/public/rewards/member/${newToken}`);
    expect(fresh.status).toBe(200);
  });

  it('rejects public mutation methods', async () => {
    await seedProgram(true);
    await seedMember({ points: 1 });
    const post = await request(app).post(`/api/v1/public/rewards/member/${tokenA}`).send({});
    expect(post.status).toBe(405);
  });

  it('above max balance has no negative remaining', async () => {
    await seedProgram(true);
    await seedBaselineRewards();
    await seedMember({ points: 120 });
    await getMenuModel().updateOne({ kodeMenu: 'SYR001' }, { $set: { status: 'hidden' } });
    await getMenuModel().updateOne({ kodeMenu: 'AYM002' }, { $set: { status: 'sold_out' } });

    const res = await request(app).get(`/api/v1/public/rewards/member/${tokenA}`);
    expect(res.body.data.progress.message).not.toMatch(/-/);
    expect(res.body.data.rewards.every((r: { eligible: boolean }) => r.eligible)).toBe(true);
    const dada = res.body.data.rewards.find((r: { name: string }) => r.name === 'Ayam Dada');
    expect(dada.eligible).toBe(true);
    expect(dada.availability).toBe('TEMPORARILY_UNAVAILABLE');
  });
});

describe('public rewards rate limiter (isolated)', () => {
  it('returns 429 after max requests', async () => {
    const app = express();
    app.use(
      rateLimit({
        windowMs: 60_000,
        max: 2,
        standardHeaders: true,
        legacyHeaders: false,
        validate: { xForwardedForHeader: false },
        message: {
          success: false,
          error: { code: 'PUBLIC_429', message: 'Terlalu banyak permintaan. Coba lagi nanti.' },
        },
      }),
    );
    app.get('/t', (_req, res) => res.json({ ok: true }));

    await request(app).get('/t').expect(200);
    await request(app).get('/t').expect(200);
    const limited = await request(app).get('/t');
    expect(limited.status).toBe(429);
    expect(limited.body.error.code).toBe('PUBLIC_429');
  });
});
