import type { IDomainEvent } from '../../domain/events/IDomainEvent.js';
import type { IOutboxRepository } from '../../core/events/IOutboxRepository.js';

export class EventPublisher {
  constructor(private readonly outbox: IOutboxRepository) {}

  async publish(event: IDomainEvent, session?: unknown): Promise<void> {
    await this.outbox.enqueue(event, session);
  }

  async publishAll(events: readonly IDomainEvent[], session?: unknown): Promise<void> {
    for (const event of events) {
      await this.publish(event, session);
    }
  }
}
