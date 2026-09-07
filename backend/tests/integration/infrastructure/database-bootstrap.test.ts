import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach, vi } from 'vitest';
import { resetEnvCache } from '../../../src/config/env.js';
import { bootstrapInfrastructure } from '../../../src/bootstrap.js';
import { insertBootstrapRecord } from '../../../src/infrastructure/database/bootstrap/insertBootstrapRecord.js';

// External Redis is not needed for the real, isolated Mongo startup exercise.
vi.mock('../../../src/config/redis.js', () => ({ connectRedis: vi.fn() }));
vi.mock('../../../src/config/queue.js', () => ({ getPlaceholderQueue: vi.fn() }));
import {
  setupMongoMemoryServer,
  teardownMongoMemoryServer,
} from '../../helpers/persistence/mongo-memory.js';
import { initializePosInfrastructure } from '../../../src/infrastructure/pos/PosModule.js';
import { runDatabaseBootstrap } from '../../../src/infrastructure/database/bootstrap/runDatabaseBootstrap.js';
import {
  BOOTSTRAP_DOC_ID,
  BOOTSTRAP_VERSION,
  SEED_VERSION,
} from '../../../src/infrastructure/database/bootstrap/bootstrapConstants.js';
import { getSystemBootstrapModel } from '../../../src/infrastructure/database/bootstrap/SystemBootstrapDocument.js';
import { getMenuModel } from '../../../src/infrastructure/pos/documents/MenuDocument.js';
import { getUserModel } from '../../../src/infrastructure/auth/documents/UserDocument.js';

describe('Database Bootstrap', () => {
  beforeAll(async () => {
    await setupMongoMemoryServer();
    await initializePosInfrastructure();
  });

  afterAll(async () => {
    await teardownMongoMemoryServer();
  });

  beforeEach(async () => {
    // These models are connected exclusively to MongoMemoryReplSet by beforeAll.
    await Promise.all([
      getMenuModel().deleteMany({}),
      getUserModel().deleteMany({}),
      getSystemBootstrapModel().deleteMany({}),
    ]);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
    resetEnvCache();
  });

  it('preserves every existing field on production first boot and repeated full startup', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('CORS_ORIGINS', 'https://pos.example.test');
    resetEnvCache();
    for (const kodeMenu of ['MNM003', 'ADD001', 'PKT001']) {
      await getMenuModel().collection.insertOne({
        _id: `operator_${kodeMenu}`,
        kodeMenu,
        namaMenu: 'Operator name',
        hargaJual: 98765,
        kodeKategori: 'SIDE',
        namaKategori: 'Operator category',
        status: 'unavailable',
        tipeMenu: 'BUNDLE',
        sellingTime: 'custom hours',
        bundleItems: [{ kodeMenu: 'LL001', qty: 3 }],
        hpp: 1234,
        operationalFlag: false,
        createdAt: new Date('2020-01-01'),
        updatedAt: new Date('2021-01-01'),
      });
    }
    const before = await getMenuModel()
      .collection.find({ _id: /^operator_/ })
      .sort({ _id: 1 })
      .toArray();
    for (let restart = 0; restart < 3; restart++) {
      await bootstrapInfrastructure();
      expect(
        await getMenuModel()
          .collection.find({ _id: /^operator_/ })
          .sort({ _id: 1 })
          .toArray(),
      ).toEqual(before);
      expect(await getMenuModel().countDocuments()).toBe(14);
      expect(await getUserModel().countDocuments()).toBe(0);
    }
  });

  it('allows concurrent first boots and preserves the winning records and marker', async () => {
    await Promise.all([bootstrapInfrastructure(), bootstrapInfrastructure()]);
    expect(await getMenuModel().countDocuments()).toBe(14);
    expect(await getUserModel().countDocuments()).toBe(2);
    expect(await getSystemBootstrapModel().countDocuments()).toBe(1);
    const before = await getMenuModel().find().sort({ kodeMenu: 1 }).lean();
    const marker = await getSystemBootstrapModel().findById(BOOTSTRAP_DOC_ID).lean();
    await Promise.all([bootstrapInfrastructure(), bootstrapInfrastructure()]);
    expect(await getMenuModel().find().sort({ kodeMenu: 1 }).lean()).toEqual(before);
    expect(await getSystemBootstrapModel().findById(BOOTSTRAP_DOC_ID).lean()).toEqual(marker);
  });

  it('does not replenish deleted baseline records once the marker exists', async () => {
    await runDatabaseBootstrap();
    await getMenuModel().deleteOne({ kodeMenu: 'ADD001' });
    await runDatabaseBootstrap();
    expect(await getMenuModel().exists({ kodeMenu: 'ADD001' })).toBeNull();
  });

  it('preserves operator-created indexes during infrastructure startup', async () => {
    await getMenuModel().collection.createIndex(
      { sellingTime: 1 },
      { name: 'operator_selling_time' },
    );
    await initializePosInfrastructure();
    expect((await getMenuModel().collection.indexes()).map((index) => index.name)).toContain(
      'operator_selling_time',
    );
  });

  it('accepts only duplicate-key errors with a verified business-key winner', async () => {
    await runDatabaseBootstrap();
    const model = getMenuModel();
    const duplicate = Object.assign(new Error('duplicate'), { code: 11000 });
    vi.spyOn(model, 'updateOne').mockRejectedValue(duplicate);
    await expect(insertBootstrapRecord(model, { kodeMenu: 'ADD001' }, {})).resolves.toBeUndefined();
    await expect(insertBootstrapRecord(model, { kodeMenu: 'MISSING' }, {})).rejects.toBe(duplicate);
  });

  it('propagates non-duplicate write failures', async () => {
    const model = getMenuModel();
    const failure = new Error('write unavailable');
    vi.spyOn(model, 'updateOne').mockRejectedValue(failure);
    await expect(insertBootstrapRecord(model, { kodeMenu: 'ADD001' }, {})).rejects.toBe(failure);
  });

  it('installs initial data once and skips on subsequent startups', async () => {
    await runDatabaseBootstrap();

    const bootstrap = await getSystemBootstrapModel().findById(BOOTSTRAP_DOC_ID).lean();
    expect(bootstrap).toBeDefined();
    expect(bootstrap?.version).toBe(BOOTSTRAP_VERSION);
    expect(bootstrap?.seedVersion).toBe(SEED_VERSION);
    expect(bootstrap?.installedAt).toBeInstanceOf(Date);

    const menuCountAfterFirst = await getMenuModel().countDocuments();
    expect(menuCountAfterFirst).toBe(14);

    const userCountAfterFirst = await getUserModel().countDocuments();
    expect(userCountAfterFirst).toBe(2);

    await getMenuModel().updateOne(
      { kodeMenu: 'LL001' },
      { $set: { hargaJual: 99_999, namaMenu: 'Lele Spesial' } },
    );
    await getMenuModel().create({
      _id: 'menu_custom_001',
      kodeMenu: 'CUSTOM001',
      namaMenu: 'Menu Operator',
      tipeMenu: 'ITEM',
      kodeKategori: 'ADDON',
      namaKategori: 'Add On',
      hargaJual: 5_000,
      status: 'available',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const firstInstalledAt = bootstrap!.installedAt;

    await runDatabaseBootstrap();

    const bootstrapAfterRestart = await getSystemBootstrapModel().findById(BOOTSTRAP_DOC_ID).lean();
    expect(bootstrapAfterRestart?.installedAt.getTime()).toBe(firstInstalledAt.getTime());

    const lele = await getMenuModel().findOne({ kodeMenu: 'LL001' }).lean();
    expect(lele?.hargaJual).toBe(99_999);
    expect(lele?.namaMenu).toBe('Lele Spesial');

    const customMenu = await getMenuModel().findOne({ kodeMenu: 'CUSTOM001' }).lean();
    expect(customMenu).toBeDefined();

    const menuCountAfterRestart = await getMenuModel().countDocuments();
    expect(menuCountAfterRestart).toBe(15);
  });
});
