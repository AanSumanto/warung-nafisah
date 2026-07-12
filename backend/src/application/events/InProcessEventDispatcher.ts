import type { IDomainEvent } from '../../domain/events/IDomainEvent.js';
import type { IEventConsumerLog } from '../../core/events/IEventConsumerLog.js';
import type { IDeadLetterQueue, IFailedEventLog } from '../../core/events/IDeadLetterQueue.js';
import { EventRetryPolicy } from '../../core/events/EventRetryPolicy.js';
import type { EventRegistry } from './EventRegistry.js';
import type { IEventDispatcher } from './IEventDispatcher.js';

export class InProcessEventDispatcher implements IEventDispatcher {
  constructor(
    private readonly registry: EventRegistry,
    private readonly consumerLog: IEventConsumerLog,
    private readonly deadLetterQueue: IDeadLetterQueue,
    private readonly failedEventLog: IFailedEventLog,
    private readonly retryPolicy = new EventRetryPolicy(),
  ) {}

  async dispatch(event: IDomainEvent): Promise<void> {
    const handlers = this.registry.getHandlers(event.eventName);

    for (const handler of handlers) {
      const alreadyProcessed = await this.consumerLog.isProcessed(
        event.eventId,
        handler.handlerName,
      );
      if (alreadyProcessed) continue;

      try {
        await this.retryPolicy.execute(() => handler.handle(event));
        await this.consumerLog.record(event.eventId, handler.handlerName);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown handler error';
        await this.failedEventLog.log({
          eventId: event.eventId,
          eventName: event.eventName,
          handlerName: handler.handlerName,
          error: message,
          retryCount: this.retryPolicy.maxAttempts,
        });
        await this.deadLetterQueue.enqueue({
          eventId: event.eventId,
          eventName: event.eventName,
          handlerName: handler.handlerName,
          event,
          error: message,
          retryCount: this.retryPolicy.maxAttempts,
        });
        throw error;
      }
    }
  }
}
