import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app.js';

vi.mock('../../src/config/database.js', () => ({
  pingDatabase: vi.fn(),
  isDatabaseConnected: vi.fn(() => true),
}));

vi.mock('../../src/config/redis.js', () => ({
  pingRedis: vi.fn(),
  getRedisStatus: vi.fn(() => ({
    connected: true,
    protocol: 'redis',
    host: 'localhost',
    port: 6379,
    tls: false,
    provider: 'redis-oss',
    maskedUrl: 'redis://localhost:6379',
  })),
}));

vi.mock('../../src/config/queue.js', () => ({
  isQueueReady: vi.fn(),
}));

import { pingDatabase } from '../../src/config/database.js';
import { pingRedis } from '../../src/config/redis.js';
import { isQueueReady } from '../../src/config/queue.js';

describe('Health API', () => {
  const app = createApp();

  beforeEach(() => {
    vi.mocked(pingDatabase).mockReset();
    vi.mocked(pingRedis).mockReset();
    vi.mocked(isQueueReady).mockReset();
  });

  it('GET /api/v1/health/live returns 200', async () => {
    const res = await request(app).get('/api/v1/health/live');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('alive');
    expect(res.headers['x-request-id']).toBeDefined();
    expect(res.headers['x-correlation-id']).toBeDefined();
  });

  it('GET /api/v1/health/ready returns 200 when dependencies up', async () => {
    vi.mocked(pingDatabase).mockResolvedValue(true);
    vi.mocked(pingRedis).mockResolvedValue(true);
    vi.mocked(isQueueReady).mockResolvedValue(true);

    const res = await request(app).get('/api/v1/health/ready');
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('ready');
  });

  it('GET /api/v1/health/ready returns 503 when dependencies down', async () => {
    vi.mocked(pingDatabase).mockResolvedValue(false);
    vi.mocked(pingRedis).mockResolvedValue(false);
    vi.mocked(isQueueReady).mockResolvedValue(false);

    const res = await request(app).get('/api/v1/health/ready');
    expect(res.status).toBe(503);
    expect(res.body.success).toBe(false);
  });

  it('GET /api/v1/health/health returns dependency detail', async () => {
    vi.mocked(pingDatabase).mockResolvedValue(true);
    vi.mocked(pingRedis).mockResolvedValue(true);
    vi.mocked(isQueueReady).mockResolvedValue(true);

    const res = await request(app).get('/api/v1/health/health');
    expect(res.status).toBe(200);
    expect(res.body.data.dependencies.mongodb).toBeDefined();
    expect(res.body.data.dependencies.redis.provider).toBe('redis-oss');
    expect(res.body.data.dependencies.redis.maskedUrl).not.toContain('password');
  });
});
