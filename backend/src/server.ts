import type { Server } from 'node:http';
import { createApp } from './app.js';
import { getEnv } from './config/env.js';
import { connectDatabase, disconnectDatabase } from './config/database.js';
import { connectRedis, disconnectRedis } from './config/redis.js';
import { getPlaceholderQueue, closeQueueConnections } from './config/queue.js';
import { logger } from './config/logger.js';
import { initializePosInfrastructure } from './infrastructure/pos/PosModule.js';
import { seedPosData } from './infrastructure/auth/seedPosData.js';

let server: Server | null = null;
let shuttingDown = false;

async function bootstrap(): Promise<void> {
  const env = getEnv();

  await connectDatabase();
  await initializePosInfrastructure();
  await seedPosData();
  await connectRedis();
  getPlaceholderQueue();

  const app = createApp();
  server = app.listen(env.PORT, env.HOST, () => {
    logger.info(
      { host: env.HOST, port: env.PORT, env: env.NODE_ENV },
      'Warung Nafisah API server started',
    );
  });
}

async function shutdown(signal: string): Promise<void> {
  if (shuttingDown) return;
  shuttingDown = true;

  logger.info({ signal }, 'Graceful shutdown initiated');

  const closeServer = new Promise<void>((resolve, reject) => {
    if (!server) {
      resolve();
      return;
    }
    server.close((err) => {
      if (err) reject(err);
      else resolve();
    });
  });

  try {
    await closeServer;
    await closeQueueConnections();
    await disconnectRedis();
    await disconnectDatabase();
    logger.info('Graceful shutdown complete');
    process.exit(0);
  } catch (err) {
    logger.error({ err }, 'Error during shutdown');
    process.exit(1);
  }
}

process.on('SIGTERM', () => void shutdown('SIGTERM'));
process.on('SIGINT', () => void shutdown('SIGINT'));

bootstrap().catch((err) => {
  logger.fatal({ err }, 'Failed to start server');
  process.exit(1);
});
