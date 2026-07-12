import type { IDomainEvent } from './IDomainEvent.js';

export interface EventEnvelope<T extends IDomainEvent = IDomainEvent> {
  readonly event: T;
  readonly storedAt: Date;
  readonly sequence?: number;
}

export function createEventEnvelope<T extends IDomainEvent>(
  event: T,
  storedAt: Date = new Date(),
  sequence?: number,
): EventEnvelope<T> {
  return Object.freeze({
    event,
    storedAt,
    ...(sequence !== undefined ? { sequence } : {}),
  });
}
