import type { ClientSession } from 'mongoose';
import type { IDomainEvent } from '../../domain/events/IDomainEvent.js';
import type { IEventStoreRepository, StoredEventRecord } from '../../core/events/IEventStore.js';
import { getStoredEventModel, type StoredEventDocument } from './documents/EventDocuments.js';

export class MongoEventStore implements IEventStoreRepository {
  readonly storeName = 'business_events';

  async append(event: IDomainEvent, session?: unknown): Promise<StoredEventRecord> {
    const now = new Date();
    const doc = {
      _id: event.eventId,
      eventName: event.eventName,
      eventVersion: event.eventVersion,
      aggregateId: event.aggregateId,
      aggregateType: event.aggregateType,
      occurredAt: event.occurredAt,
      storedAt: now,
      payload: event.payload,
      metadata: event.metadata as Record<string, unknown> | undefined,
      createdAt: now,
      updatedAt: now,
    };

    await getStoredEventModel().create([doc], { session: session as ClientSession | null });

    return {
      eventId: event.eventId,
      eventName: event.eventName,
      eventVersion: event.eventVersion,
      aggregateId: event.aggregateId,
      aggregateType: event.aggregateType,
      occurredAt: event.occurredAt,
      storedAt: now,
      payload: event.payload,
      metadata: event.metadata as Record<string, unknown> | undefined,
    };
  }

  async findById(eventId: string): Promise<StoredEventRecord | null> {
    const doc = await getStoredEventModel().findById(eventId).lean();
    if (!doc) return null;
    return this.toRecord(doc);
  }

  async findByAggregate(aggregateId: string, aggregateType?: string): Promise<StoredEventRecord[]> {
    const filter: Record<string, string> = { aggregateId };
    if (aggregateType) filter.aggregateType = aggregateType;
    const docs = await getStoredEventModel().find(filter).sort({ storedAt: 1 }).lean();
    return docs.map((d) => this.toRecord(d));
  }

  private toRecord(doc: StoredEventDocument): StoredEventRecord {
    return {
      eventId: String(doc._id),
      eventName: doc.eventName,
      eventVersion: doc.eventVersion,
      aggregateId: doc.aggregateId,
      aggregateType: doc.aggregateType,
      occurredAt: doc.occurredAt,
      storedAt: doc.storedAt,
      payload: doc.payload,
      metadata: doc.metadata,
      sequence: doc.sequence,
    };
  }
}

export { MongoEventStore as EventStoreRepository };
