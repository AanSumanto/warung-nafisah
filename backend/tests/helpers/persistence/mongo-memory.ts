import { MongoMemoryReplSet } from 'mongodb-memory-server';
import { MongoConnectionManager } from '../../../src/infrastructure/database/MongoConnectionManager.js';
import { getTestItemModel } from '../../helpers/persistence/test-item.fixture.js';

let replSet: MongoMemoryReplSet | null = null;

export async function setupMongoMemoryServer(): Promise<string> {
  replSet = await MongoMemoryReplSet.create({
    replSet: { count: 1, storageEngine: 'wiredTiger' },
  });
  const uri = replSet.getUri();
  const manager = MongoConnectionManager.getInstance();
  manager.configureForTest(uri, 'warung_nafisah_persistence_test');
  await manager.connect();
  return uri;
}

export async function teardownMongoMemoryServer(): Promise<void> {
  const manager = MongoConnectionManager.getInstance();
  await manager.disconnect();
  manager.resetTestConfiguration();
  if (replSet) {
    await replSet.stop();
    replSet = null;
  }
}

export async function clearTestCollections(): Promise<void> {
  await getTestItemModel().deleteMany({});
}
