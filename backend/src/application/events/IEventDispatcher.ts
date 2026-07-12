import type { IDomainEvent } from '../../domain/events/IDomainEvent.js';

export interface IEventDispatcher {
  dispatch(event: IDomainEvent): Promise<void>;
}
