import type { IDomainEvent } from '../../domain/events/IDomainEvent.js';

export interface StoredEventRecord {
  readonly eventId: string;
  readonly eventName: string;
  readonly eventVersion: number;
  readonly aggregateId: string;
  readonly aggregateType: string;
  readonly occurredAt: Date;
  readonly storedAt: Date;
  readonly payload: Record<string, unknown>;
  readonly metadata?: Record<string, unknown>;
  readonly sequence?: number;
}

export interface IEventStore {
  append(event: IDomainEvent, session?: unknown): Promise<StoredEventRecord>;
  findById(eventId: string): Promise<StoredEventRecord | null>;
  findByAggregate(aggregateId: string, aggregateType?: string): Promise<StoredEventRecord[]>;
}

export interface IEventStoreRepository extends IEventStore {
  readonly storeName: string;
}
