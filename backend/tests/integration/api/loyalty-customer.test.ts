import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../../../src/app.js';
import {
  setupMongoMemoryServer,
  teardownMongoMemoryServer,
} from '../../helpers/persistence/mongo-memory.js';
import { loginAndGetToken } from '../../helpers/auth/login.js';
import { ensureEventCollections } from '../../../src/infrastructure/events/EventPlatformFactory.js';
import { runDatabaseBootstrap } from '../../../src/infrastructure/database/bootstrap/runDatabaseBootstrap.js';
import { getCustomerModel } from '../../../src/infrastructure/loyalty/documents/CustomerDocument.js';
import { getMenuModel } from '../../../src/infrastructure/pos/documents/MenuDocument.js';

const KASIR_EMAIL = 'kasir@warungnafisah.local';
const OWNER_EMAIL = 'owner@warungnafisah.local';
const DEFAULT_PASSWORD = 'warung123';

describe('LOYALTY-01 Customer Foundation API', () => {
  const app = createApp();
  let kasirToken = '';
  let ownerToken = '';

  beforeAll(async () => {
    await setupMongoMemoryServer();
    await ensureEventCollections();
    const { initializePosInfrastructure } = await import(
      '../../../src/infrastructure/pos/PosModule.js'
    );
    await initializePosInfrastructure();
    await runDatabaseBootstrap();
  });

  afterAll(async () => {
    await teardownMongoMemoryServer();
  });

  beforeEach(async () => {
    await getCustomerModel().deleteMany({});
    kasirToken = await loginAndGetToken(app, KASIR_EMAIL, DEFAULT_PASSWORD);
    ownerToken = await loginAndGetToken(app, OWNER_EMAIL, DEFAULT_PASSWORD);
  });

  it('rejects unauthenticated access', async () => {
    const res = await request(app).post('/api/v1/customers').send({ phone: '081234567890' });
    expect(res.status).toBe(401);
  });

  it('allows kasir to register, lookup, and read customer', async () => {
    const register = await request(app)
      .post('/api/v1/customers')
      .set('Authorization', `Bearer ${kasirToken}`)
      .send({ phone: '081234567890', name: 'Aan' });

    expect(register.status).toBe(201);
    expect(register.body.success).toBe(true);
    expect(register.body.data.phoneMasked).toBe('0812******90');
    expect(register.body.data.phoneNormalized).toBeUndefined();
    expect(register.body.data.currentPoints).toBe(0);
    expect(register.body.data.publicMemberId).toMatch(/^[A-Za-z0-9_-]{32}$/);
    expect(register.body.data.name).toBe('Aan');

    const customerId = register.body.data.id as string;

    const lookup08 = await request(app)
      .get('/api/v1/customers/lookup')
      .query({ phone: '081234567890' })
      .set('Authorization', `Bearer ${kasirToken}`);
    expect(lookup08.status).toBe(200);
    expect(lookup08.body.data.id).toBe(customerId);

    const lookupPlus = await request(app)
      .get('/api/v1/customers/lookup')
      .query({ phone: '+6281234567890' })
      .set('Authorization', `Bearer ${kasirToken}`);
    expect(lookupPlus.status).toBe(200);
    expect(lookupPlus.body.data.id).toBe(customerId);

    const byId = await request(app)
      .get(`/api/v1/customers/${customerId}`)
      .set('Authorization', `Bearer ${kasirToken}`);
    expect(byId.status).toBe(200);
    expect(byId.body.data.id).toBe(customerId);
    expect(byId.body.data.phoneNormalized).toBeUndefined();
  });

  it('allows owner to register and lookup', async () => {
    const register = await request(app)
      .post('/api/v1/customers')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ phone: '628111222333' });
    expect(register.status).toBe(201);

    const lookup = await request(app)
      .get('/api/v1/customers/lookup')
      .query({ phone: '08111222333' })
      .set('Authorization', `Bearer ${ownerToken}`);
    expect(lookup.status).toBe(200);
    expect(lookup.body.data.id).toBe(register.body.data.id);
  });

  it('rejects invalid phone', async () => {
    const res = await request(app)
      .post('/api/v1/customers')
      .set('Authorization', `Bearer ${kasirToken}`)
      .send({ phone: 'not-a-phone' });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('prevents duplicate registration across equivalent phone formats', async () => {
    const first = await request(app)
      .post('/api/v1/customers')
      .set('Authorization', `Bearer ${kasirToken}`)
      .send({ phone: '081234567890' });
    expect(first.status).toBe(201);

    const second = await request(app)
      .post('/api/v1/customers')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ phone: '+6281234567890' });
    expect(second.status).toBe(400);
    expect(second.body.error.message).toContain('sudah terdaftar');
    expect(String(second.body.error.message)).not.toContain('E11000');

    const count = await getCustomerModel().countDocuments({ phoneNormalized: '6281234567890' });
    expect(count).toBe(1);
  });

  it('prevents concurrent duplicate registration', async () => {
    const phone = '081299988877';
    const results = await Promise.all(
      Array.from({ length: 8 }, () =>
        request(app)
          .post('/api/v1/customers')
          .set('Authorization', `Bearer ${kasirToken}`)
          .send({ phone, name: 'Concurrent' }),
      ),
    );

    const successes = results.filter((r) => r.status === 201);
    const conflicts = results.filter((r) => r.status === 400);
    expect(successes.length).toBe(1);
    expect(conflicts.length).toBe(7);

    const count = await getCustomerModel().countDocuments({ phoneNormalized: '6281299988877' });
    expect(count).toBe(1);
  });

  it('returns 404 for unknown customer / phone', async () => {
    const lookup = await request(app)
      .get('/api/v1/customers/lookup')
      .query({ phone: '081200000001' })
      .set('Authorization', `Bearer ${kasirToken}`);
    expect(lookup.status).toBe(404);

    const byId = await request(app)
      .get('/api/v1/customers/00000000-0000-4000-8000-000000000099')
      .set('Authorization', `Bearer ${kasirToken}`);
    expect(byId.status).toBe(404);
  });

  it('creates unique indexes on customers and does not seed customers', async () => {
    const indexes = await getCustomerModel().collection.indexes();
    const keys = indexes.map((idx) => Object.keys(idx.key).join(','));
    expect(keys.some((k) => k.includes('phoneNormalized'))).toBe(true);
    expect(keys.some((k) => k.includes('publicMemberId'))).toBe(true);

    const uniquePhone = indexes.find((idx) => idx.key.phoneNormalized === 1);
    const uniquePublic = indexes.find((idx) => idx.key.publicMemberId === 1);
    expect(uniquePhone?.unique).toBe(true);
    expect(uniquePublic?.unique).toBe(true);

    expect(await getCustomerModel().countDocuments({})).toBe(0);
    // Master menu still present from bootstrap (PROD-DATA-01 regression)
    expect(await getMenuModel().countDocuments({})).toBeGreaterThanOrEqual(12);
  });
});
