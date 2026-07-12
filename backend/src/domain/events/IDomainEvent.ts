/**
 * Domain event interface only — no Event Store or Event Bus in Sprint 2.
 */
export interface IDomainEvent {
  readonly eventId: string;
  readonly eventName: string;
  readonly eventVersion: number;
  readonly aggregateId: string;
  readonly aggregateType: string;
  readonly occurredAt: Date;
  readonly payload: Record<string, unknown>;
  readonly metadata?: Record<string, unknown>;
}

export interface IDomainEventConstructor<T extends IDomainEvent = IDomainEvent> {
  new (...args: never[]): T;
  readonly eventName: string;
  readonly eventVersion: number;
}

/** Sprint 2 alias — `DomainEvent` is the canonical name for `IDomainEvent`. */
export type DomainEvent = IDomainEvent;
