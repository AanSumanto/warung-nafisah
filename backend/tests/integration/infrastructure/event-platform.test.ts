import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { BusinessEvent } from '../../../src/domain/events/BusinessEvent.js';
import type { IDomainEvent } from '../../../src/domain/events/IDomainEvent.js';
import { BaseEventHandler } from '../../../src/application/events/IEventHandler.js';
import { AuditTimelineProjection } from '../../../src/application/events/AuditTimelineProjection.js';
import { MongoUnitOfWork } from '../../../src/infrastructure/persistence/MongoUnitOfWork.js';
import {
  setupMongoMemoryServer,
  teardownMongoMemoryServer,
} from '../../helpers/persistence/mongo-memory.js';
import {
  createEventPlatform,
  clearEventCollections,
  ensureEventCollections,
} from '../../helpers/events/platform.fixture.js';
import { EventSerializer } from '../../../src/application/events/EventSerializer.js';

class TestRecordingHandler extends BaseEventHandler {
  readonly handlerName = 'test-recording-handler';
  readonly eventName = 'platform.test.recorded';
  calls = 0;

  async handle(_event: IDomainEvent): Promise<void> {
    this.calls += 1;
  }
}

class TestFailingHandler extends BaseEventHandler {
  readonly handlerName = 'test-failing-handler';
  readonly eventName = 'platform.test.failing';

  async handle(_event: IDomainEvent): Promise<void> {
    throw new Error('handler failure');
  }
}

describe('Business Event Platform Integration', () => {
  let platform: ReturnType<typeof createEventPlatform>;
  let unitOfWork: MongoUnitOfWork;
  let recordingHandler: TestRecordingHandler;

  beforeAll(async () => {
    await setupMongoMemoryServer();
    await ensureEventCollections();
  });

  afterAll(async () => {
    await teardownMongoMemoryServer();
  });

  beforeEach(async () => {
    await clearEventCollections();
    platform = createEventPlatform({ retryAttempts: 2 });
    unitOfWork = new MongoUnitOfWork();
    recordingHandler = new TestRecordingHandler();
    platform.registry.register(recordingHandler);
  });

  function createTestEvent(name = 'platform.test.recorded'): BusinessEvent {
    return BusinessEvent.create({
      eventName: name,
      aggregateId: 'agg-001',
      aggregateType: 'TestAggregate',
      payload: { value: 1 },
      metadata: { correlationId: 'corr-1' },
    });
  }

  it('publishes event to outbox within transaction', async () => {
    const event = createTestEvent();

    await unitOfWork.execute(async () => {
      await platform.publisher.publish(event, unitOfWork.getActiveSession());
    });

    const pending = await platform.outbox.findPending();
    expect(pending).toHaveLength(1);
    expect(pending[0]?.eventId).toBe(event.eventId);
  });

  it('persists event and dispatches to handler', async () => {
    const event = createTestEvent();

    await unitOfWork.execute(async () => {
      await platform.publisher.publish(event, unitOfWork.getActiveSession());
    });

    const count = await platform.outboxDispatcher.dispatchPending();
    expect(count).toBe(1);

    const stored = await platform.eventStore.findById(event.eventId);
    expect(stored?.eventName).toBe('platform.test.recorded');
    expect(recordingHandler.calls).toBe(1);
  });

  it('enforces idempotency via consumer log', async () => {
    const event = createTestEvent();

    await platform.publisher.publish(event);
    await platform.outboxDispatcher.dispatchPending();
    expect(recordingHandler.calls).toBe(1);

    await platform.dispatcher.dispatch(event);
    expect(recordingHandler.calls).toBe(1);
    expect(await platform.consumerLog.isProcessed(event.eventId, recordingHandler.handlerName)).toBe(
      true,
    );
  });

  it('serializes and deserializes events', () => {
    const event = createTestEvent();
    const serializer = new EventSerializer();
    const raw = serializer.serialize(event);
    const parsed = JSON.parse(raw) as { eventId: string };
    expect(parsed.eventId).toBe(event.eventId);
  });

  it('routes failed handlers to dead letter queue', async () => {
    const failingPlatform = createEventPlatform({ retryAttempts: 1 });
    failingPlatform.registry.register(new TestFailingHandler());
    const event = createTestEvent('platform.test.failing');

    await failingPlatform.publisher.publish(event);

    const count = await failingPlatform.outboxDispatcher.dispatchPending();
    expect(count).toBe(0);

    const deadLetters = await failingPlatform.deadLetter.findAll();
    expect(deadLetters.length).toBeGreaterThanOrEqual(1);
    expect(deadLetters[0]?.handlerName).toBe('test-failing-handler');
  });

  it('records inbox entry on dispatch', async () => {
    const event = createTestEvent();
    await platform.publisher.publish(event);
    await platform.outboxDispatcher.dispatchPending();

    const inbox = await platform.inbox.findPending();
    expect(inbox.length).toBe(0);
  });

  it('registers and runs projections', async () => {
    const audit = new AuditTimelineProjection();
    platform.projectionRegistry.register(audit);

    const event = createTestEvent();
    await platform.publisher.publish(event);
    await platform.outboxDispatcher.dispatchPending();

    expect(audit.getEntries()).toHaveLength(1);
    expect(audit.getEntries()[0]?.eventId).toBe(event.eventId);
  });

  it('business event is immutable', () => {
    const event = createTestEvent();
    expect(Object.isFrozen(event)).toBe(true);
    expect(Object.isFrozen(event.payload)).toBe(true);
  });
});
