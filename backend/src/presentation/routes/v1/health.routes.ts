import { Router } from 'express';
import { pingDatabase, isDatabaseConnected } from '../../../config/database.js';
import { pingRedis, getRedisStatus } from '../../../config/redis.js';
import { isQueueReady } from '../../../config/queue.js';
import { getEnv } from '../../../config/env.js';
import { ResponseWrapper } from '../../../core/http/ResponseWrapper.js';

export const healthRouter = Router();

/** Liveness — process is running */
healthRouter.get('/live', (_req, res) => {
  return ResponseWrapper.success(res, {
    status: 'alive',
    uptime: process.uptime(),
  });
});

/** Readiness — dependencies available */
healthRouter.get('/ready', async (_req, res) => {
  const [mongoOk, redisOk, queueOk] = await Promise.all([
    pingDatabase(),
    pingRedis(),
    isQueueReady(),
  ]);

  const ready = mongoOk && redisOk && queueOk;

  const payload = {
    status: ready ? 'ready' : 'not_ready',
    checks: {
      mongodb: mongoOk ? 'up' : 'down',
      redis: redisOk ? 'up' : 'down',
      bullmq: queueOk ? 'up' : 'down',
    },
  };

  if (!ready) {
    return ResponseWrapper.error(res, 'SYS_503', 'Service not ready', 503, payload.checks);
  }

  return ResponseWrapper.success(res, payload);
});

/** Detailed health — disabled in production to avoid infrastructure disclosure */
healthRouter.get('/health', async (_req, res) => {
  if (getEnv().NODE_ENV === 'production') {
    return ResponseWrapper.error(res, 'SYS_002', 'Endpoint tidak ditemukan', 404);
  }

  const env = getEnv();
  const [mongoPing, redisPing, queueOk] = await Promise.all([
    pingDatabase(),
    pingRedis(),
    isQueueReady(),
  ]);

  return ResponseWrapper.success(res, {
    status: mongoPing && redisPing ? 'healthy' : 'degraded',
    version: '0.10.0',
    environment: env.NODE_ENV,
    uptime: process.uptime(),
    dependencies: {
      mongodb: {
        connected: isDatabaseConnected(),
        ping: mongoPing,
        database: env.MONGODB_DB_NAME,
      },
      redis: {
        ...getRedisStatus(),
        ping: redisPing,
      },
      bullmq: {
        prepared: queueOk,
        status: queueOk ? 'connected' : 'unavailable',
      },
    },
  });
});
