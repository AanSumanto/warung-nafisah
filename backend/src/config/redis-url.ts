import { URL } from 'node:url';

export type RedisProtocol = 'redis' | 'rediss';

export interface ParsedRedisUrl {
  readonly protocol: RedisProtocol;
  readonly host: string;
  readonly port: number;
  readonly username?: string;
  readonly password?: string;
  readonly tls: boolean;
  readonly maskedUrl: string;
}

export class RedisUrlParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RedisUrlParseError';
  }
}

export function parseRedisUrl(redisUrl: string): ParsedRedisUrl {
  let parsed: URL;

  try {
    parsed = new URL(redisUrl);
  } catch {
    throw new RedisUrlParseError('REDIS_URL is not a valid URL');
  }

  const protocol = parsed.protocol.replace(':', '') as RedisProtocol;
  if (protocol !== 'redis' && protocol !== 'rediss') {
    throw new RedisUrlParseError(
      `REDIS_URL protocol must be redis:// or rediss:// (got ${protocol}://)`,
    );
  }

  const host = parsed.hostname;
  if (!host) {
    throw new RedisUrlParseError('REDIS_URL must include a host');
  }

  const port = parsed.port ? Number(parsed.port) : 6379;
  const username = parsed.username ? decodeURIComponent(parsed.username) : undefined;
  const password = parsed.password ? decodeURIComponent(parsed.password) : undefined;
  const tls = protocol === 'rediss';

  return {
    protocol,
    host,
    port,
    username: username || undefined,
    password: password || undefined,
    tls,
    maskedUrl: maskParsedRedisUrl({ protocol, host, port, username, password, tls }),
  };
}

export function maskParsedRedisUrl(parsed: {
  protocol: RedisProtocol;
  host: string;
  port: number;
  username?: string;
  password?: string;
  tls?: boolean;
}): string {
  const hasAuth = Boolean(parsed.username || parsed.password);
  const auth = hasAuth ? '***:***@' : '';
  return `${parsed.protocol}://${auth}${parsed.host}:${parsed.port}`;
}

export function maskRedisUrl(redisUrl: string): string {
  try {
    return parseRedisUrl(redisUrl).maskedUrl;
  } catch {
    return '[invalid-redis-url]';
  }
}

export function detectRedisProvider(host: string): 'upstash' | 'redis-cloud' | 'redis-oss' {
  const normalized = host.toLowerCase();
  if (normalized.includes('upstash.io')) return 'upstash';
  if (normalized.includes('redislabs.com') || normalized.includes('redis.cloud')) {
    return 'redis-cloud';
  }
  return 'redis-oss';
}

export interface RedisConnectionConfig {
  host: string;
  port: number;
  username?: string;
  password?: string;
  maxRetriesPerRequest: null;
  enableReadyCheck: boolean;
  lazyConnect: boolean;
  tls?: Record<string, never>;
}

export function toRedisConnectionConfig(parsed: ParsedRedisUrl): RedisConnectionConfig {
  return {
    host: parsed.host,
    port: parsed.port,
    ...(parsed.username ? { username: parsed.username } : {}),
    ...(parsed.password ? { password: parsed.password } : {}),
    maxRetriesPerRequest: null,
    enableReadyCheck: true,
    lazyConnect: true,
    ...(parsed.tls ? { tls: {} } : {}),
  };
}

export function formatRedisErrorReason(error: unknown): string {
  if (error instanceof Error) {
    const message = error.message;
    if (message.includes('NOAUTH')) {
      return 'Authentication failed — check username/password in REDIS_URL';
    }
    if (message.includes('ENOTFOUND')) {
      return 'Host not found — check REDIS_URL host';
    }
    if (message.includes('ECONNREFUSED')) {
      return 'Connection refused — Redis server not reachable';
    }
    if (message.includes('certificate') || message.includes('TLS')) {
      return 'TLS handshake failed — use rediss:// for TLS endpoints';
    }
    return message;
  }
  return 'Unknown Redis connection error';
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
