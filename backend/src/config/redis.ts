import { Redis } from 'ioredis';
import { getEnv } from './env.js';
import { logger } from './logger.js';
import {
  parseRedisUrl,
  toRedisConnectionConfig,
  formatRedisErrorReason,
  detectRedisProvider,
  sleep,
  type ParsedRedisUrl,
} from './redis-url.js';

const STARTUP_MAX_ATTEMPTS = 5;
const RECONNECT_LOG_INTERVAL_MS = 30_000;

let client: Redis | null = null;
let parsedConfig: ParsedRedisUrl | null = null;
let listenersAttached = false;
let lastReconnectLogAt = 0;

export class RedisConnectionError extends Error {
  readonly parsed: ParsedRedisUrl;

  constructor(message: string, parsed: ParsedRedisUrl, cause?: unknown) {
    super(message, { cause });
    this.name = 'RedisConnectionError';
    this.parsed = parsed;
  }
}

function getParsedConfig(): ParsedRedisUrl {
  if (!parsedConfig) {
    parsedConfig = parseRedisUrl(getEnv().REDIS_URL);
  }
  return parsedConfig;
}

function buildRetryStrategy() {
  return (times: number): number | null => {
    if (times > 15) return null;
    return Math.min(times * 500, 10_000);
  };
}

function attachListeners(redis: Redis): void {
  if (listenersAttached) return;
  listenersAttached = true;

  redis.on('error', (err) => {
    logger.error({ reason: formatRedisErrorReason(err) }, 'Redis runtime error');
  });

  redis.on('reconnecting', (delay: number) => {
    const now = Date.now();
    if (now - lastReconnectLogAt < RECONNECT_LOG_INTERVAL_MS) return;
    lastReconnectLogAt = now;
    logger.warn({ delayMs: delay }, 'Redis reconnecting');
  });

  redis.on('end', () => {
    logger.warn('Redis connection ended');
  });
}

function createClient(): Redis {
  const parsed = getParsedConfig();
  const options = {
    ...toRedisConnectionConfig(parsed),
    retryStrategy: buildRetryStrategy(),
  };

  const redis = new Redis(options);
  attachListeners(redis);
  return redis;
}

export function getRedisClient(): Redis {
  if (!client) {
    client = createClient();
  }
  return client;
}

function logConnectionSuccess(parsed: ParsedRedisUrl): void {
  logger.info(
    {
      protocol: parsed.protocol,
      host: parsed.host,
      port: parsed.port,
      tls: parsed.tls,
      provider: detectRedisProvider(parsed.host),
      url: parsed.maskedUrl,
    },
    '✓ Redis Connected',
  );
}

function logConnectionFailure(parsed: ParsedRedisUrl, reason: string): void {
  logger.fatal(
    {
      protocol: parsed.protocol,
      host: parsed.host,
      port: parsed.port,
      tls: parsed.tls,
      provider: detectRedisProvider(parsed.host),
      url: parsed.maskedUrl,
      reason,
    },
    '✗ Redis Connection Failed',
  );
}

function resetClient(): void {
  if (!client) return;
  try {
    client.disconnect(false);
  } catch {
    // ignore
  }
  client = null;
  listenersAttached = false;
}

export async function connectRedis(): Promise<void> {
  const parsed = getParsedConfig();

  if (client?.status === 'ready') {
    logConnectionSuccess(parsed);
    return;
  }

  for (let attempt = 1; attempt <= STARTUP_MAX_ATTEMPTS; attempt++) {
    const redis = getRedisClient();

    try {
      if (redis.status === 'wait' || redis.status === 'end') {
        await redis.connect();
      }
      const pong = await redis.ping();
      if (pong !== 'PONG') {
        throw new Error(`Unexpected PING response: ${pong}`);
      }
      logConnectionSuccess(parsed);
      return;
    } catch (error) {
      const reason = formatRedisErrorReason(error);
      const isLast = attempt >= STARTUP_MAX_ATTEMPTS;

      resetClient();

      if (isLast) {
        logConnectionFailure(parsed, reason);
        throw new RedisConnectionError(
          `Redis connection failed after ${STARTUP_MAX_ATTEMPTS} attempts: ${reason}`,
          parsed,
          error,
        );
      }

      const delayMs = Math.min(1000 * 2 ** (attempt - 1), 10_000);
      logger.warn(
        {
          attempt,
          maxAttempts: STARTUP_MAX_ATTEMPTS,
          retryInMs: delayMs,
          reason,
          url: parsed.maskedUrl,
        },
        'Redis connection attempt failed, retrying',
      );
      await sleep(delayMs);
    }
  }
}

export async function disconnectRedis(): Promise<void> {
  if (!client) return;

  const redis = client;
  client = null;
  parsedConfig = null;
  listenersAttached = false;
  lastReconnectLogAt = 0;

  try {
    if (redis.status !== 'end') {
      await redis.quit();
    }
  } catch {
    redis.disconnect(false);
  }

  logger.info('Redis disconnected');
}

export function isRedisConnected(): boolean {
  return client?.status === 'ready';
}

export async function pingRedis(): Promise<boolean> {
  if (!client || client.status !== 'ready') {
    return false;
  }
  try {
    return (await client.ping()) === 'PONG';
  } catch {
    return false;
  }
}

export function getRedisStatus(): {
  connected: boolean;
  protocol: string;
  host: string;
  port: number;
  tls: boolean;
  provider: string;
  maskedUrl: string;
} {
  const parsed = getParsedConfig();
  return {
    connected: isRedisConnected(),
    protocol: parsed.protocol,
    host: parsed.host,
    port: parsed.port,
    tls: parsed.tls,
    provider: detectRedisProvider(parsed.host),
    maskedUrl: parsed.maskedUrl,
  };
}

/** BullMQ uses bundled ioredis — pass explicit host/port/auth (not `url` field). */
export function getBullMqConnectionOptions() {
  const parsed = getParsedConfig();
  return {
    ...toRedisConnectionConfig(parsed),
    lazyConnect: false,
    retryStrategy: buildRetryStrategy(),
  };
}

export { parseRedisUrl, maskRedisUrl, detectRedisProvider } from './redis-url.js';
