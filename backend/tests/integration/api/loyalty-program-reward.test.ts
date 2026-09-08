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
import { getLoyaltyProgramModel } from '../../../src/infrastructure/loyalty/documents/LoyaltyProgramDocument.js';
import { getLoyaltyRewardModel } from '../../../src/infrastructure/loyalty/documents/LoyaltyRewardDocument.js';
import { getCustomerModel } from '../../../src/infrastructure/loyalty/documents/CustomerDocument.js';
import { getMenuModel } from '../../../src/infrastructure/pos/documents/MenuDocument.js';
import { createLoyaltyModule } from '../../../src/infrastructure/loyalty/LoyaltyModule.js';
import { LOYALTY_PROGRAM_CODE } from '../../../src/domain/loyalty/LoyaltyTypes.js';
import {
  BASELINE_REWARD_CATALOG,
  BASELINE_REWARD_COUNT,
} from '../../../src/application/loyalty/baselineRewardCatalog.js';

const KASIR_EMAIL = 'kasir@warungnafisah.local';
const OWNER_EMAIL = 'owner@warungnafisah.local';
const DEFAULT_PASSWORD = 'warung123';

describe('LOYALTY-02 Program + Reward Catalog', () => {
  const app = createApp();
  let kasirToken = '';
  let ownerToken = '';
  let loyaltyModule: ReturnType<typeof createLoyaltyModule>;

  beforeAll(async () => {
    await setupMongoMemoryServer();
    await ensureEventCollections();
    const { initializePosInfrastructure } = await import(
      '../../../src/infrastructure/pos/PosModule.js'
    );
    await initializePosInfrastructure();
    await runDatabaseBootstrap();
    loyaltyModule = createLoyaltyModule();
  });

  afterAll(async () => {
    await teardownMongoMemoryServer();
  });

  beforeEach(async () => {
    await Promise.all([
      getLoyaltyProgramModel().deleteMany({}),
      getLoyaltyRewardModel().deleteMany({}),
      getCustomerModel().deleteMany({}),
    ]);
    kasirToken = await loginAndGetToken(app, KASIR_EMAIL, DEFAULT_PASSWORD);
    ownerToken = await loginAndGetToken(app, OWNER_EMAIL, DEFAULT_PASSWORD);
  });

  it('baseline catalog has exactly 7 rewards with production menu keys', () => {
    expect(BASELINE_REWARD_COUNT).toBe(7);
    expect(BASELINE_REWARD_CATALOG).toHaveLength(7);

    const codes = BASELINE_REWARD_CATALOG.map((r) => r.menuKode);
    expect(codes).toEqual([
      'MNM001',
      'NAS001',
      'MDG001',
      'SYR001',
      'LL001',
      'AYM001',
      'AYM002',
    ]);

    // Historical MDL001 must not appear in runtime baseline
    expect(JSON.stringify(BASELINE_REWARD_CATALOG)).not.toContain('MDL001');
    expect(BASELINE_REWARD_CATALOG.some((r) => r.rewardCode === 'REWARD_AYAM')).toBe(false);

    const paha = BASELINE_REWARD_CATALOG.find((r) => r.rewardCode === 'REWARD_AYAM_PAHA');
    const dada = BASELINE_REWARD_CATALOG.find((r) => r.rewardCode === 'REWARD_AYAM_DADA');
    expect(paha).toMatchObject({
      menuKode: 'AYM001',
      pointsRequired: 100,
      hppEstimate: 9000,
      sortOrder: 60,
    });
    expect(dada).toMatchObject({
      menuKode: 'AYM002',
      pointsRequired: 100,
      hppEstimate: 9000,
      sortOrder: 70,
    });
    expect(paha!.sortOrder).toBeLessThan(dada!.sortOrder);

    // Same pointsRequired allowed for two rewards
    expect(
      BASELINE_REWARD_CATALOG.filter((r) => r.pointsRequired === 100),
    ).toHaveLength(2);
  });

  it('installer creates disabled program + 7 rewards; second run is no-op', async () => {
    const first = await loyaltyModule.loyaltyConfigInstaller.install({
      actorId: 'test-installer',
    });
    expect(first.success).toBe(true);
    expect(first.program.action).toBe('create');
    expect(first.program.enabled).toBe(false);
    expect(first.rewards.filter((r) => r.action === 'create')).toHaveLength(7);

    const program = await getLoyaltyProgramModel().findOne({ programCode: LOYALTY_PROGRAM_CODE });
    expect(program?.enabled).toBe(false);
    expect(program?.pointEarnRate).toBe(5000);
    expect(await getLoyaltyRewardModel().countDocuments({})).toBe(7);

    const second = await loyaltyModule.loyaltyConfigInstaller.install({
      actorId: 'test-installer',
    });
    expect(second.success).toBe(true);
    expect(second.program.action).toBe('already_exists');
    expect(second.rewards.every((r) => r.action === 'already_exists')).toBe(true);
    expect(await getLoyaltyRewardModel().countDocuments({})).toBe(7);
  });

  it('installer dry-run does not write', async () => {
    const result = await loyaltyModule.loyaltyConfigInstaller.install({ dryRun: true });
    expect(result.success).toBe(true);
    expect(result.program.action).toBe('would_create');
    expect(await getLoyaltyProgramModel().countDocuments({})).toBe(0);
    expect(await getLoyaltyRewardModel().countDocuments({})).toBe(0);
  });

  it('installer does not overwrite conflicting reward', async () => {
    await loyaltyModule.loyaltyConfigInstaller.install({ actorId: 'test' });
    await getLoyaltyRewardModel().updateOne(
      { rewardCode: 'REWARD_ES_TEH' },
      { $set: { pointsRequired: 99 } },
    );

    const result = await loyaltyModule.loyaltyConfigInstaller.install({ actorId: 'test' });
    expect(result.success).toBe(false);
    expect(result.rewards.some((r) => r.action === 'conflict')).toBe(true);
    const esTeh = await getLoyaltyRewardModel().findOne({ rewardCode: 'REWARD_ES_TEH' });
    expect(esTeh?.pointsRequired).toBe(99);
  });

  it('installer blocks when AYM002 missing', async () => {
    await getMenuModel().deleteOne({ kodeMenu: 'AYM002' });
    const result = await loyaltyModule.loyaltyConfigInstaller.install({ actorId: 'test' });
    expect(result.success).toBe(false);
    expect(result.errors.some((e) => e.includes('AYM002'))).toBe(true);
    expect(await getLoyaltyProgramModel().countDocuments({})).toBe(0);
    expect(await getLoyaltyRewardModel().countDocuments({})).toBe(0);

    const now = new Date();
    await getMenuModel().create({
      _id: 'menu_aym002',
      kodeMenu: 'AYM002',
      namaMenu: 'Ayam Dada',
      tipeMenu: 'ITEM',
      kodeKategori: 'MODEL',
      namaKategori: 'Model Gandum',
      hargaJual: 17000,
      status: 'available',
      createdAt: now,
      updatedAt: now,
    });
  });

  it('installer blocks when MNM001 missing and restores menu', async () => {
    await getMenuModel().deleteOne({ kodeMenu: 'MNM001' });
    const result = await loyaltyModule.loyaltyConfigInstaller.install({ actorId: 'test' });
    expect(result.success).toBe(false);
    expect(result.errors.some((e) => e.includes('MNM001'))).toBe(true);
    const now = new Date();
    await getMenuModel().create({
      _id: 'menu_mnm001',
      kodeMenu: 'MNM001',
      namaMenu: 'Es Teh',
      tipeMenu: 'ITEM',
      kodeKategori: 'MINUMAN',
      namaKategori: 'Minuman',
      hargaJual: 3000,
      status: 'available',
      createdAt: now,
      updatedAt: now,
    });
  });

  it('installer does not modify menu master', async () => {
    const before = await getMenuModel().findOne({ kodeMenu: 'LL001' }).lean();
    await loyaltyModule.loyaltyConfigInstaller.install({ actorId: 'test' });
    const after = await getMenuModel().findOne({ kodeMenu: 'LL001' }).lean();
    expect(after?.hargaJual).toBe(before?.hargaJual);
    expect(after?.namaMenu).toBe(before?.namaMenu);
    expect(after?.status).toBe(before?.status);
  });

  it('owner can read/update program; cannot enable; kasir read-only', async () => {
    await loyaltyModule.loyaltyConfigInstaller.install({ actorId: 'test' });

    const ownerRead = await request(app)
      .get('/api/v1/loyalty/program')
      .set('Authorization', `Bearer ${ownerToken}`);
    expect(ownerRead.status).toBe(200);
    expect(ownerRead.body.data.enabled).toBe(false);

    const kasirRead = await request(app)
      .get('/api/v1/loyalty/program')
      .set('Authorization', `Bearer ${kasirToken}`);
    expect(kasirRead.status).toBe(200);

    const enableAttempt = await request(app)
      .put('/api/v1/loyalty/program')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ enabled: true });
    expect(enableAttempt.status).toBe(400);
    expect(enableAttempt.body.error.message).toMatch(/belum diizinkan/i);

    const updateRate = await request(app)
      .put('/api/v1/loyalty/program')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ pointEarnRate: 5000 });
    expect(updateRate.status).toBe(200);
    expect(updateRate.body.data.enabled).toBe(false);

    const kasirMutate = await request(app)
      .put('/api/v1/loyalty/program')
      .set('Authorization', `Bearer ${kasirToken}`)
      .send({ pointEarnRate: 7000 });
    expect(kasirMutate.status).toBe(403);
  });

  it('lists both 100-pt chicken rewards separately with deterministic order', async () => {
    await loyaltyModule.loyaltyConfigInstaller.install({ actorId: 'test' });

    const list = await request(app)
      .get('/api/v1/loyalty/rewards')
      .set('Authorization', `Bearer ${kasirToken}`);
    expect(list.status).toBe(200);
    expect(list.body.data).toHaveLength(7);

    const codes = list.body.data.map((r: { rewardCode: string }) => r.rewardCode);
    expect(codes).toEqual([
      'REWARD_ES_TEH',
      'REWARD_NASI_PUTIH',
      'REWARD_MODEL_GANDUM',
      'REWARD_CAH_KANGKUNG',
      'REWARD_LELE',
      'REWARD_AYAM_PAHA',
      'REWARD_AYAM_DADA',
    ]);

    const chickens = list.body.data.filter(
      (r: { pointsRequired: number }) => r.pointsRequired === 100,
    );
    expect(chickens).toHaveLength(2);
    expect(chickens[0].rewardCode).toBe('REWARD_AYAM_PAHA');
    expect(chickens[0].menuKode).toBe('AYM001');
    expect(chickens[1].rewardCode).toBe('REWARD_AYAM_DADA');
    expect(chickens[1].menuKode).toBe('AYM002');
  });

  it('owner manages rewards; kasir cannot mutate; unauthenticated rejected', async () => {
    await loyaltyModule.loyaltyConfigInstaller.install({ actorId: 'test' });

    const unauth = await request(app).get('/api/v1/loyalty/rewards');
    expect(unauth.status).toBe(401);

    const kasirCreate = await request(app)
      .post('/api/v1/loyalty/rewards')
      .set('Authorization', `Bearer ${kasirToken}`)
      .send({
        rewardCode: 'REWARD_TEST',
        name: 'Test',
        menuKode: 'MNM001',
        pointsRequired: 5,
        hppEstimate: 100,
        sortOrder: 99,
      });
    expect(kasirCreate.status).toBe(403);

    const badMenu = await request(app)
      .post('/api/v1/loyalty/rewards')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        rewardCode: 'REWARD_GHOST',
        name: 'Ghost',
        menuKode: 'NOPE999',
        pointsRequired: 5,
        hppEstimate: 100,
        sortOrder: 99,
      });
    expect(badMenu.status).toBe(400);
    expect(badMenu.body.error.message).toMatch(/tidak ditemukan/i);

    const deactivate = await request(app)
      .put('/api/v1/loyalty/rewards/REWARD_ES_TEH')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ status: 'inactive' });
    expect(deactivate.status).toBe(200);
    expect(deactivate.body.data.status).toBe('inactive');
  });

  it('allows configuring reward against sold_out menu without modifying menu', async () => {
    await getMenuModel().updateOne({ kodeMenu: 'MNM001' }, { $set: { status: 'sold_out' } });
    const create = await request(app)
      .post('/api/v1/loyalty/rewards')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        rewardCode: 'REWARD_SOLD_OUT_OK',
        name: 'Sold Out Ok',
        menuKode: 'MNM001',
        pointsRequired: 15,
        hppEstimate: 1500,
        sortOrder: 1,
      });
    expect(create.status).toBe(201);
    const menu = await getMenuModel().findOne({ kodeMenu: 'MNM001' }).lean();
    expect(menu?.status).toBe('sold_out');
    await getMenuModel().updateOne({ kodeMenu: 'MNM001' }, { $set: { status: 'available' } });
  });

  it('unique indexes: rewardCode unique, pointsRequired NOT unique', async () => {
    const programIndexes = await getLoyaltyProgramModel().collection.indexes();
    const rewardIndexes = await getLoyaltyRewardModel().collection.indexes();
    expect(programIndexes.some((i) => i.key.programCode === 1 && i.unique)).toBe(true);
    expect(rewardIndexes.some((i) => i.key.rewardCode === 1 && i.unique)).toBe(true);
    expect(rewardIndexes.some((i) => i.key.pointsRequired === 1 && i.unique)).toBe(false);

    expect(await getLoyaltyProgramModel().countDocuments({})).toBe(0);
    expect(await getLoyaltyRewardModel().countDocuments({})).toBe(0);
    expect(await getCustomerModel().countDocuments({})).toBe(0);
  });
});
