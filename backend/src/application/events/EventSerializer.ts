import type { IDomainEvent } from '../../domain/events/IDomainEvent.js';
import type { EventMetadata } from '../../domain/events/EventMetadata.js';
import { BusinessEvent } from '../../domain/events/BusinessEvent.js';

export interface SerializedEvent {
  readonly eventId: string;
  readonly eventName: string;
  readonly eventVersion: number;
  readonly aggregateId: string;
  readonly aggregateType: string;
  readonly occurredAt: string;
  readonly payload: Record<string, unknown>;
  readonly metadata?: Record<string, unknown>;
}

export class EventSerializer {
  serialize(event: IDomainEvent): string {
    const data: SerializedEvent = {
      eventId: event.eventId,
      eventName: event.eventName,
      eventVersion: event.eventVersion,
      aggregateId: event.aggregateId,
      aggregateType: event.aggregateType,
      occurredAt: event.occurredAt.toISOString(),
      payload: event.payload,
      metadata: event.metadata as Record<string, unknown> | undefined,
    };
    return JSON.stringify(data);
  }

  toObject(event: IDomainEvent): SerializedEvent {
    return JSON.parse(this.serialize(event)) as SerializedEvent;
  }
}

export class EventDeserializer {
  deserialize(raw: string): IDomainEvent {
    const data = JSON.parse(raw) as SerializedEvent;
    return BusinessEvent.create({
      eventId: data.eventId,
      eventName: data.eventName,
      eventVersion: data.eventVersion,
      aggregateId: data.aggregateId,
      aggregateType: data.aggregateType,
      occurredAt: new Date(data.occurredAt),
      payload: data.payload,
      metadata: data.metadata as EventMetadata | undefined,
    });
  }

  fromObject(data: SerializedEvent): IDomainEvent {
    return this.deserialize(JSON.stringify(data));
  }
}
