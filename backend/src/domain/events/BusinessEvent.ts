import { BaseDomainEvent, type BaseDomainEventProps } from './BaseDomainEvent.js';
import type { EventMetadata } from './EventMetadata.js';

export interface BusinessEventCreateProps {
  readonly eventName: string;
  readonly aggregateId: string;
  readonly aggregateType: string;
  readonly payload: Record<string, unknown>;
  readonly metadata?: EventMetadata;
  readonly eventVersion?: number;
  readonly eventId?: string;
  readonly occurredAt?: Date;
}

/**
 * Canonical business event — one immutable event per business action.
 */
export class BusinessEvent extends BaseDomainEvent {
  static create(props: BusinessEventCreateProps): BusinessEvent {
    return new BusinessEvent(props);
  }

  private constructor(props: BaseDomainEventProps) {
    super(props);
  }
}
