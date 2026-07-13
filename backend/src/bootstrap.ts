import { connectDatabase } from './config/database.js';
import { connectRedis } from './config/redis.js';
import { getPlaceholderQueue } from './config/queue.js';
import { initializePosInfrastructure } from './infrastructure/pos/PosModule.js';
import { runDatabaseBootstrap } from './infrastructure/database/bootstrap/runDatabaseBootstrap.js';

export async function bootstrapInfrastructure(): Promise<void> {
  await connectDatabase();
  await initializePosInfrastructure();
  await runDatabaseBootstrap();
  await connectRedis();
  getPlaceholderQueue();
}
