import { createEventPlatform, ensureEventCollections } from '../../../src/infrastructure/events/EventPlatformFactory.js';

export { createEventPlatform, ensureEventCollections };

export async function clearEventCollections(): Promise<void> {
  const {
    getStoredEventModel,
    getOutboxModel,
    getInboxModel,
    getConsumerLogModel,
    getDeadLetterModel,
    getFailedEventModel,
  } = await import('../../../src/infrastructure/events/documents/EventDocuments.js');

  await Promise.all([
    getStoredEventModel().deleteMany({}),
    getOutboxModel().deleteMany({}),
    getInboxModel().deleteMany({}),
    getConsumerLogModel().deleteMany({}),
    getDeadLetterModel().deleteMany({}),
    getFailedEventModel().deleteMany({}),
  ]);
}
