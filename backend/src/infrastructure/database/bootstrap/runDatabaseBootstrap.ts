import { installInitialData } from '../../auth/seedPosData.js';
import {
  BOOTSTRAP_DOC_ID,
  BOOTSTRAP_VERSION,
  SEED_VERSION,
} from './bootstrapConstants.js';
import { getSystemBootstrapModel } from './SystemBootstrapDocument.js';

async function ensureSystemBootstrapCollection(): Promise<void> {
  const model = getSystemBootstrapModel();
  try {
    await model.createCollection();
  } catch {
    // already exists
  }
  await model.syncIndexes();
}

/**
 * Runs once per database. Subsequent application starts skip all seeders.
 */
export async function runDatabaseBootstrap(): Promise<void> {
  await ensureSystemBootstrapCollection();

  const model = getSystemBootstrapModel();
  const existing = await model.findById(BOOTSTRAP_DOC_ID).lean();

  if (existing) {
    console.log('[Bootstrap] Bootstrap already completed. Skipping Initial Seed.');
    console.log(
      `[Bootstrap] version=${existing.version} seedVersion=${existing.seedVersion} installedAt=${existing.installedAt.toISOString()}`,
    );
    return;
  }

  console.log('[Bootstrap] First startup detected. Installing initial data...');
  await installInitialData();

  const installedAt = new Date();
  await model.create({
    _id: BOOTSTRAP_DOC_ID,
    version: BOOTSTRAP_VERSION,
    seedVersion: SEED_VERSION,
    installedAt,
  });

  console.log(
    `[Bootstrap] Initial data installed. Bootstrap record created (version=${BOOTSTRAP_VERSION}, seedVersion=${SEED_VERSION}).`,
  );
}
