import { afterEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app.js';
import { resetEnvCache } from '../../src/config/env.js';
import { resetCorsStartupLog } from '../../src/config/cors.js';

const PRODUCTION_ORIGIN = 'https://warung-nafisah.vercel.app';
const LOCAL_ORIGIN = 'http://localhost:3000';

function createAppWithCorsOrigins(origins: string) {
  process.env.CORS_ORIGINS = origins;
  resetEnvCache();
  resetCorsStartupLog();
  return createApp();
}

describe('CORS middleware', () => {
  afterEach(() => {
    process.env.CORS_ORIGINS = LOCAL_ORIGIN;
    resetEnvCache();
    resetCorsStartupLog();
  });

  it('allows localhost preflight', async () => {
    const app = createAppWithCorsOrigins(LOCAL_ORIGIN);

    const res = await request(app)
      .options('/api/v1/health/live')
      .set('Origin', LOCAL_ORIGIN)
      .set('Access-Control-Request-Method', 'GET');

    expect(res.status).toBe(204);
    expect(res.headers['access-control-allow-origin']).toBe(LOCAL_ORIGIN);
    expect(res.headers['access-control-allow-credentials']).toBe('true');
  });

  it('allows production Vercel origin on GET', async () => {
    const app = createAppWithCorsOrigins(`${PRODUCTION_ORIGIN},${LOCAL_ORIGIN}`);

    const res = await request(app)
      .get('/api/v1/health/live')
      .set('Origin', PRODUCTION_ORIGIN);

    expect(res.status).toBe(200);
    expect(res.headers['access-control-allow-origin']).toBe(PRODUCTION_ORIGIN);
    expect(res.headers['access-control-allow-credentials']).toBe('true');
  });

  it('returns 403 for disallowed origin without HTTP 500', async () => {
    const app = createAppWithCorsOrigins(LOCAL_ORIGIN);

    const res = await request(app)
      .get('/api/v1/health/live')
      .set('Origin', PRODUCTION_ORIGIN);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('CORS_001');
    expect(res.headers['access-control-allow-origin']).toBeUndefined();
  });

  it('returns 403 for disallowed preflight', async () => {
    const app = createAppWithCorsOrigins(LOCAL_ORIGIN);

    const res = await request(app)
      .options('/api/v1/auth/login')
      .set('Origin', PRODUCTION_ORIGIN)
      .set('Access-Control-Request-Method', 'POST');

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('CORS_001');
  });

  it('allows requests without Origin header', async () => {
    const app = createAppWithCorsOrigins(LOCAL_ORIGIN);

    const res = await request(app).get('/api/v1/health/live');
    expect(res.status).toBe(200);
  });
});
