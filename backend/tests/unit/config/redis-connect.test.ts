import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const connectMock = vi.fn();
const pingMock = vi.fn();
const disconnectMock = vi.fn();
const quitMock = vi.fn();
const onMock = vi.fn();

let mockStatus = 'wait';

class MockRedis {
  status = mockStatus;
  connect = connectMock;
  ping = pingMock;
  disconnect = disconnectMock;
  quit = quitMock;
  on = onMock;
}

vi.mock('ioredis', () => ({
  Redis: MockRedis,
}));

vi.mock('../../../src/config/redis-url.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../src/config/redis-url.js')>();
  return {
    ...actual,
    sleep: vi.fn().mockResolvedValue(undefined),
  };
});

describe('connectRedis fail-fast', () => {
  beforeEach(async () => {
    vi.resetModules();
    mockStatus = 'wait';
    connectMock.mockReset();
    pingMock.mockReset();
    disconnectMock.mockReset();
    onMock.mockReset();

    process.env.REDIS_URL = 'rediss://default:wrong-password@redis.example.com:6379';
    process.env.MONGODB_URI = 'mongodb://127.0.0.1:27017';
    process.env.MONGODB_DB_NAME = 'test';

    const { resetEnvCache } = await import('../../../src/config/env.js');
    resetEnvCache();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('throws RedisConnectionError on NOAUTH after retries', async () => {
    connectMock.mockResolvedValue(undefined);
    pingMock.mockRejectedValue(new Error('NOAUTH Authentication required.'));

    const { connectRedis, RedisConnectionError, disconnectRedis } = await import(
      '../../../src/config/redis.js'
    );

    await expect(connectRedis()).rejects.toBeInstanceOf(RedisConnectionError);
    expect(connectMock.mock.calls.length).toBeGreaterThanOrEqual(1);
    await disconnectRedis();
  });

  it('succeeds when ping returns PONG', async () => {
    connectMock.mockResolvedValue(undefined);
    pingMock.mockResolvedValue('PONG');
    mockStatus = 'wait';

    const { connectRedis, disconnectRedis } = await import('../../../src/config/redis.js');
    await expect(connectRedis()).resolves.toBeUndefined();
    await disconnectRedis();
  });
});
