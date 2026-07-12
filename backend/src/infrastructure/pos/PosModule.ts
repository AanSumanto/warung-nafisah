import { MongoRepository } from '../persistence/repositories/MongoRepository.js';
import { MongoUnitOfWork } from '../persistence/MongoUnitOfWork.js';
import { AuditTimelineProjection } from '../../application/events/AuditTimelineProjection.js';
import { createEventPlatform, ensureEventCollections } from '../events/EventPlatformFactory.js';
import type { EventPlatform } from './pos.types.js';
import { MenuMapper } from './mappers/MenuMapper.js';
import { OrderMapper } from './mappers/OrderMapper.js';
import { ShiftMapper } from './mappers/ShiftMapper.js';
import { getMenuModel } from './documents/MenuDocument.js';
import { getOrderModel } from './documents/OrderDocument.js';
import { getShiftModel, getOrderSequenceModel } from './documents/ShiftDocument.js';
import { getOrderItemModel, getPaymentModel } from './documents/OrderItemDocument.js';
import { getUserModel } from '../auth/documents/UserDocument.js';
import { MongoOrderNumberGenerator } from './MongoOrderNumberGenerator.js';
import { PaymentWriter } from './PaymentWriter.js';
import { AuthService } from '../auth/AuthService.js';
import { PosService } from '../../application/pos/PosService.js';
import { getEnv } from '../../config/env.js';

let cachedPlatform: EventPlatform | null = null;

export function getEventPlatform(): EventPlatform {
  if (!cachedPlatform) {
    const audit = new AuditTimelineProjection();
    const platform = createEventPlatform();
    platform.projectionRegistry.register(audit);
    cachedPlatform = { ...platform, auditProjection: audit };
  }
  return cachedPlatform;
}

export function createPosModule(unitOfWork = new MongoUnitOfWork()) {
  const getSession = () => unitOfWork.getActiveSession();
  const menuRepository = new MongoRepository(getMenuModel(), new MenuMapper(), {}, getSession);
  const orderRepository = new MongoRepository(getOrderModel(), new OrderMapper(), {}, getSession);
  const shiftRepository = new MongoRepository(getShiftModel(), new ShiftMapper(), {}, getSession);
  const orderNumberGenerator = new MongoOrderNumberGenerator();
  const paymentWriter = new PaymentWriter();
  const platform = getEventPlatform();
  const authService = new AuthService(getEnv().JWT_SECRET);

  const posService = new PosService({
    unitOfWork,
    menuRepository,
    orderRepository,
    shiftRepository,
    orderNumberGenerator,
    paymentWriter,
    eventPublisher: platform.publisher,
    outboxDispatcher: platform.outboxDispatcher,
    eventStore: platform.eventStore,
    outbox: platform.outbox,
  });

  return {
    unitOfWork,
    menuRepository,
    orderRepository,
    shiftRepository,
    orderNumberGenerator,
    paymentWriter,
    platform,
    authService,
    posService,
  };
}

export async function initializePosInfrastructure(): Promise<void> {
  await ensureEventCollections();
  const models = [
    getMenuModel(),
    getOrderModel(),
    getShiftModel(),
    getOrderSequenceModel(),
    getOrderItemModel(),
    getPaymentModel(),
    getUserModel(),
  ];
  await Promise.all(
    models.map(async (m) => {
      try {
        await m.createCollection();
      } catch {
        // already exists
      }
      await m.syncIndexes();
    }),
  );
}
