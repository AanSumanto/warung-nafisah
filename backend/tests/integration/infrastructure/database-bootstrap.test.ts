import { describe, it, expect, beforeAll, afterAll } from 'vitest';
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

  it('installs initial data once and skips on subsequent startups', async () => {
    await runDatabaseBootstrap();

    const bootstrap = await getSystemBootstrapModel().findById(BOOTSTRAP_DOC_ID).lean();
    expect(bootstrap).toBeDefined();
    expect(bootstrap?.version).toBe(BOOTSTRAP_VERSION);
    expect(bootstrap?.seedVersion).toBe(SEED_VERSION);
    expect(bootstrap?.installedAt).toBeInstanceOf(Date);

    const menuCountAfterFirst = await getMenuModel().countDocuments();
    expect(menuCountAfterFirst).toBe(13);

    const userCountAfterFirst = await getUserModel().countDocuments();
    expect(userCountAfterFirst).toBe(2);

    await getMenuModel().updateOne({ kodeMenu: 'LL001' }, { $set: { hargaJual: 99_999, namaMenu: 'Lele Spesial' } });
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
    expect(menuCountAfterRestart).toBe(14);
  });
});
