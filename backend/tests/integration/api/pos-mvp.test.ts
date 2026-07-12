import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../../../src/app.js';
import {
  setupMongoMemoryServer,
  teardownMongoMemoryServer,
} from '../../helpers/persistence/mongo-memory.js';
import { ensureEventCollections } from '../../../src/infrastructure/events/EventPlatformFactory.js';
import { seedPosData } from '../../../src/infrastructure/auth/seedPosData.js';
import { getMenuModel } from '../../../src/infrastructure/pos/documents/MenuDocument.js';
import { getOrderModel } from '../../../src/infrastructure/pos/documents/OrderDocument.js';
import { getPaymentModel } from '../../../src/infrastructure/pos/documents/OrderItemDocument.js';
import { getOutboxModel } from '../../../src/infrastructure/events/documents/EventDocuments.js';
import { getStoredEventModel } from '../../../src/infrastructure/events/documents/EventDocuments.js';
import { getShiftModel } from '../../../src/infrastructure/pos/documents/ShiftDocument.js';
import { getUserModel } from '../../../src/infrastructure/auth/documents/UserDocument.js';

describe('Operational POS MVP Integration', () => {
  const app = createApp();
  let kasirToken = '';
  let ownerToken = '';
  let kodeMenu = '';

  beforeAll(async () => {
    await setupMongoMemoryServer();
    await ensureEventCollections();
    const { initializePosInfrastructure } = await import('../../../src/infrastructure/pos/PosModule.js');
    await initializePosInfrastructure();
    await seedPosData();
  });

  afterAll(async () => {
    await teardownMongoMemoryServer();
  });

  beforeEach(async () => {
    await Promise.all([
      getOrderModel().deleteMany({}),
      getPaymentModel().deleteMany({}),
      getOutboxModel().deleteMany({}),
      getStoredEventModel().deleteMany({}),
      getShiftModel().deleteMany({}),
    ]);

    const loginKasir = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'kasir@warungnafisah.local', password: 'warung123' });
    kasirToken = loginKasir.body.data.token;

    const loginOwner = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'owner@warungnafisah.local', password: 'warung123' });
    ownerToken = loginOwner.body.data.token;

    const menu = await getMenuModel().findOne({ status: 'available', kodeMenu: 'LL001' }).lean();
    kodeMenu = menu!.kodeMenu;
  });

  it('logs in kasir and owner', async () => {
    expect(kasirToken).toBeTruthy();
    expect(ownerToken).toBeTruthy();
  });

  it('lists menus', async () => {
    const res = await request(app).get('/api/v1/menus').set('Authorization', `Bearer ${kasirToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(13);
  });

  it('creates sale with business event and outbox', async () => {
    await request(app)
      .post('/api/v1/shifts/open')
      .set('Authorization', `Bearer ${kasirToken}`)
      .send({ openingCash: 100000 });

    const createRes = await request(app)
      .post('/api/v1/orders')
      .set('Authorization', `Bearer ${kasirToken}`)
      .send({ diningType: 'dine_in' });
    expect(createRes.status).toBe(201);
    const orderId = createRes.body.data.id;

    const updateRes = await request(app)
      .put(`/api/v1/orders/${orderId}/items`)
      .set('Authorization', `Bearer ${kasirToken}`)
      .send({ items: [{ kodeMenu, qty: 2 }] });
    expect(updateRes.status).toBe(200);
    expect(updateRes.body.data.total).toBe(22_000);
    expect(updateRes.body.data.items[0]).toMatchObject({
      kodeMenu: 'LL001',
      namaMenu: 'Lele',
      tipeMenu: 'ITEM',
      hargaJual: 11_000,
      qty: 2,
      subtotal: 22_000,
    });

    const payRes = await request(app)
      .post(`/api/v1/orders/${orderId}/pay`)
      .set('Authorization', `Bearer ${kasirToken}`)
      .send({ paymentMethod: 'cash', paidAmount: 50_000 });
    expect(payRes.status).toBe(200);
    expect(payRes.body.data.status).toBe('paid');
    expect(payRes.body.data.paidAmount).toBe(50_000);
    expect(payRes.body.data.changeAmount).toBe(28_000);
    expect(payRes.body.data.orderNumber).toMatch(/^WN-\d{8}-\d{6}$/);

    const outbox = await getOutboxModel().find({ eventName: 'SaleCompleted' }).lean();
    expect(outbox.length).toBeGreaterThanOrEqual(1);

    const stored = await getStoredEventModel().find({ eventName: 'SaleCompleted' }).lean();
    expect(stored.length).toBeGreaterThanOrEqual(1);

    const payment = await getPaymentModel().findOne({ orderId }).lean();
    expect(payment?.method).toBe('cash');
  });

  it('lists today transactions', async () => {
    const res = await request(app)
      .get('/api/v1/orders/today')
      .set('Authorization', `Bearer ${kasirToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('opens and closes shift', async () => {
    const openRes = await request(app)
      .post('/api/v1/shifts/open')
      .set('Authorization', `Bearer ${kasirToken}`)
      .send({ openingCash: 50000 });
    expect(openRes.status).toBe(201);

    const closeRes = await request(app)
      .post(`/api/v1/shifts/${openRes.body.data.id}/close`)
      .set('Authorization', `Bearer ${kasirToken}`)
      .send({ closingCash: 150000 });
    expect(closeRes.status).toBe(200);
    expect(closeRes.body.data.status).toBe('closed');
  });

  it('returns owner dashboard today', async () => {
    const res = await request(app)
      .get('/api/v1/owner/dashboard/today')
      .set('Authorization', `Bearer ${ownerToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('transactionCount');
    expect(res.body.data).toHaveProperty('revenue');
  });

  it('rejects kasir from owner dashboard', async () => {
    const res = await request(app)
      .get('/api/v1/owner/dashboard/today')
      .set('Authorization', `Bearer ${kasirToken}`);
    expect(res.status).toBe(401);
  });

  it('changes password for authenticated kasir', async () => {
    const changeRes = await request(app)
      .post('/api/v1/auth/change-password')
      .set('Authorization', `Bearer ${kasirToken}`)
      .send({ currentPassword: 'warung123', newPassword: 'NewSecure99!' });
    expect(changeRes.status).toBe(200);
    expect(changeRes.body.data.changed).toBe(true);

    const oldLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'kasir@warungnafisah.local', password: 'warung123' });
    expect(oldLogin.status).toBe(401);

    const newLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'kasir@warungnafisah.local', password: 'NewSecure99!' });
    expect(newLogin.status).toBe(200);

    await request(app)
      .post('/api/v1/auth/change-password')
      .set('Authorization', `Bearer ${newLogin.body.data.token}`)
      .send({ currentPassword: 'NewSecure99!', newPassword: 'warung123' });
  });

  it('rejects change password without auth', async () => {
    const res = await request(app)
      .post('/api/v1/auth/change-password')
      .send({ currentPassword: 'warung123', newPassword: 'NewSecure99!' });
    expect(res.status).toBe(401);
  });
});
