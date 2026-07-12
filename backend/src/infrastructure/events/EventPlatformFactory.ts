import { EventRegistry } from '../../application/events/EventRegistry.js';
import { ProjectionRegistry } from '../../application/events/ProjectionRegistry.js';
import { EventPublisher } from '../../application/events/EventPublisher.js';
import { InProcessEventDispatcher } from '../../application/events/InProcessEventDispatcher.js';
import { EventRetryPolicy } from '../../core/events/EventRetryPolicy.js';
import {
  MongoEventStore,
  MongoOutboxRepository,
  MongoInboxRepository,
  MongoEventConsumerLog,
  MongoDeadLetterQueue,
  MongoFailedEventLog,
  EventPersistence,
  OutboxDispatcher,
} from './index.js';
import {
  getStoredEventModel,
  getOutboxModel,
  getInboxModel,
  getConsumerLogModel,
  getDeadLetterModel,
  getFailedEventModel,
} from './documents/EventDocuments.js';

export function createEventPlatform(options?: { retryAttempts?: number }) {
  const registry = new EventRegistry();
  const projectionRegistry = new ProjectionRegistry();
  const eventStore = new MongoEventStore();
  const outbox = new MongoOutboxRepository();
  const inbox = new MongoInboxRepository();
  const consumerLog = new MongoEventConsumerLog();
  const deadLetter = new MongoDeadLetterQueue();
  const failedLog = new MongoFailedEventLog();
  const retryPolicy = new EventRetryPolicy({
    maxAttempts: options?.retryAttempts ?? 2,
    baseDelayMs: 10,
  });
  const dispatcher = new InProcessEventDispatcher(
    registry,
    consumerLog,
    deadLetter,
    failedLog,
    retryPolicy,
  );
  const persistence = new EventPersistence(
    eventStore,
    outbox,
    inbox,
    dispatcher,
    projectionRegistry,
    failedLog,
    retryPolicy,
  );
  const outboxDispatcher = new OutboxDispatcher(persistence);
  const publisher = new EventPublisher(outbox);

  return {
    registry,
    projectionRegistry,
    eventStore,
    outbox,
    inbox,
    consumerLog,
    deadLetter,
    failedLog,
    dispatcher,
    persistence,
    outboxDispatcher,
    publisher,
  };
}

export async function ensureEventCollections(): Promise<void> {
  const models = [
    getStoredEventModel(),
    getOutboxModel(),
    getInboxModel(),
    getConsumerLogModel(),
    getDeadLetterModel(),
    getFailedEventModel(),
  ];

  await Promise.all(
    models.map(async (eventModel) => {
      try {
        await eventModel.createCollection();
      } catch {
        // Collection already exists.
      }
      await eventModel.syncIndexes();
    }),
  );
}
