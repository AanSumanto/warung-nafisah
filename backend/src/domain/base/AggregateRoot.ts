import { BaseEntity } from './BaseEntity.js';
import type { Identifier } from '../common/Identifier.js';
import type { IDomainEvent } from '../events/IDomainEvent.js';

export abstract class AggregateRoot<
  T extends Record<string, unknown> = Record<string, unknown>,
> extends BaseEntity<T> {
  private _domainEvents: IDomainEvent[] = [];

  protected constructor(props: T, id: Identifier, createdAt?: Date, updatedAt?: Date) {
    super(props, id, createdAt, updatedAt);
  }

  get domainEvents(): ReadonlyArray<IDomainEvent> {
    return this._domainEvents;
  }

  protected addDomainEvent(event: IDomainEvent): void {
    this._domainEvents.push(event);
    this.touch();
  }

  clearDomainEvents(): IDomainEvent[] {
    const events = [...this._domainEvents];
    this._domainEvents = [];
    return events;
  }

  hasDomainEvents(): boolean {
    return this._domainEvents.length > 0;
  }
}
