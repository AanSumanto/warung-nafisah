import { Queue } from 'bullmq';
import { getBullMqConnectionOptions, pingRedis } from './redis.js';
import { logger } from './logger.js';

const PLACEHOLDER_QUEUE = 'wn-foundation-placeholder';

let placeholderQueue: Queue | null = null;

export function getPlaceholderQueue(): Queue {
  if (!placeholderQueue) {
    placeholderQueue = new Queue(PLACEHOLDER_QUEUE, {
      connection: getBullMqConnectionOptions(),
    });
    logger.info({ queue: PLACEHOLDER_QUEUE }, 'BullMQ placeholder queue prepared');
  }
  return placeholderQueue;
}

export async function closeQueueConnections(): Promise<void> {
  if (placeholderQueue) {
    await placeholderQueue.close();
    placeholderQueue = null;
    logger.info('BullMQ connections closed');
  }
}

export async function isQueueReady(): Promise<boolean> {
  return pingRedis();
}
