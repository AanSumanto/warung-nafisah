import type { IDomainEvent } from '../../domain/events/IDomainEvent.js';
import type { IEventStore } from '../../core/events/IEventStore.js';
import type { IOutboxRepository } from '../../core/events/IOutboxRepository.js';
import type { IInboxRepository } from '../../core/events/IInboxRepository.js';
import type { IEventDispatcher } from '../../application/events/IEventDispatcher.js';
import type { ProjectionRegistry } from '../../application/events/ProjectionRegistry.js';
import { EventRetryPolicy } from '../../core/events/EventRetryPolicy.js';
import type { IFailedEventLog } from '../../core/events/IDeadLetterQueue.js';

export class EventPersistence {
  constructor(
    private readonly eventStore: IEventStore,
    private readonly outbox: IOutboxRepository,
    private readonly inbox: IInboxRepository,
    private readonly dispatcher: IEventDispatcher,
    private readonly projectionRegistry: ProjectionRegistry,
    private readonly failedEventLog: IFailedEventLog,
    private readonly retryPolicy = new EventRetryPolicy(),
  ) {}

  async persistFromOutbox(limit = 50): Promise<number> {
    const pending = await this.outbox.findPending(limit);
    let processed = 0;

    for (const entry of pending) {
      await this.outbox.markProcessing(entry.id);
      const inboxId = `inbox_${entry.eventId}`;
      try {
        const existing = await this.eventStore.findById(entry.eventId);
        if (!existing) {
          await this.eventStore.append(entry.event);
        }

        await this.inbox.receive(entry.event);

        await this.retryPolicy.execute(async () => {
          await this.dispatcher.dispatch(entry.event);
          await this.projectionRegistry.projectAll(entry.event);
        });

        await this.inbox.markProcessed(inboxId);
        await this.outbox.markProcessed(entry.id);
        processed += 1;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Outbox dispatch failed';
        const retryCount = entry.retryCount + 1;
        await this.inbox.markFailed(inboxId, message, retryCount);
        await this.outbox.markFailed(entry.id, message, retryCount);
        await this.failedEventLog.log({
          eventId: entry.eventId,
          eventName: entry.eventName,
          error: message,
          retryCount,
          context: { outboxId: entry.id },
        });
      }
    }

    return processed;
  }

  async appendDirect(event: IDomainEvent, session?: unknown): Promise<void> {
    await this.eventStore.append(event, session);
  }
}

export class OutboxDispatcher {
  constructor(private readonly persistence: EventPersistence) {}

  async dispatchPending(limit = 50): Promise<number> {
    return this.persistence.persistFromOutbox(limit);
  }
}
