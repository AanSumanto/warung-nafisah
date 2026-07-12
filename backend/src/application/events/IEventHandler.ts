import type { IDomainEvent } from '../../domain/events/IDomainEvent.js';

export interface IEventHandler<T extends IDomainEvent = IDomainEvent> {
  readonly handlerName: string;
  readonly eventName: string;
  handle(event: T): Promise<void>;
}

export abstract class BaseEventHandler<T extends IDomainEvent = IDomainEvent>
  implements IEventHandler<T>
{
  abstract readonly handlerName: string;
  abstract readonly eventName: string;
  abstract handle(event: T): Promise<void>;
}
