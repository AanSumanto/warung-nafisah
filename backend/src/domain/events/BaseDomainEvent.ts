import type { EventMetadata } from './EventMetadata.js';
import type { IDomainEvent } from './IDomainEvent.js';
import { EventVersion } from './EventVersion.js';

export interface BaseDomainEventProps {
  readonly eventId?: string;
  readonly eventName: string;
  readonly eventVersion?: number;
  readonly aggregateId: string;
  readonly aggregateType: string;
  readonly occurredAt?: Date;
  readonly payload: Record<string, unknown>;
  readonly metadata?: EventMetadata;
}

/**
 * Immutable append-only domain event base.
 * Business events must never be updated or deleted after creation.
 */
export abstract class BaseDomainEvent implements IDomainEvent {
  readonly eventId: string;
  readonly eventName: string;
  readonly eventVersion: number;
  readonly aggregateId: string;
  readonly aggregateType: string;
  readonly occurredAt: Date;
  readonly payload: Record<string, unknown>;
  readonly metadata?: EventMetadata;

  protected constructor(props: BaseDomainEventProps) {
    this.eventId = props.eventId ?? crypto.randomUUID();
    this.eventName = props.eventName;
    this.eventVersion = props.eventVersion ?? EventVersion.initial().value;
    this.aggregateId = props.aggregateId;
    this.aggregateType = props.aggregateType;
    this.occurredAt = props.occurredAt ?? new Date();
    this.payload = Object.freeze({ ...props.payload });
    this.metadata = props.metadata ? Object.freeze({ ...props.metadata }) : undefined;
    Object.freeze(this);
  }

  toJSON(): Record<string, unknown> {
    return {
      eventId: this.eventId,
      eventName: this.eventName,
      eventVersion: this.eventVersion,
      aggregateId: this.aggregateId,
      aggregateType: this.aggregateType,
      occurredAt: this.occurredAt.toISOString(),
      payload: this.payload,
      metadata: this.metadata,
    };
  }
}
