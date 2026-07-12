import type { ClientSession } from 'mongoose';
import type { IDomainEvent } from '../../domain/events/IDomainEvent.js';
import type { IInboxRepository, InboxEntry } from '../../core/events/IInboxRepository.js';
import { EventDeserializer, EventSerializer } from '../../application/events/EventSerializer.js';
import { getInboxModel, type InboxDocument } from './documents/EventDocuments.js';

export class MongoInboxRepository implements IInboxRepository {
  private readonly serializer = new EventSerializer();
  private readonly deserializer = new EventDeserializer();

  async receive(event: IDomainEvent, session?: unknown): Promise<InboxEntry> {
    const now = new Date();
    const id = `inbox_${event.eventId}`;
    const existing = await getInboxModel().findById(id).lean();
    if (existing) {
      return this.toEntry(existing);
    }

    const envelope = this.serializer.toObject(event);

    const doc = {
      _id: id,
      eventId: event.eventId,
      eventName: event.eventName,
      envelope,
      status: 'pending' as const,
      retryCount: 0,
      receivedAt: now,
      createdAt: now,
      updatedAt: now,
    };

    await getInboxModel().create([doc], { session: session as ClientSession | null });
    return this.toEntry(doc);
  }

  async findPending(limit = 50): Promise<InboxEntry[]> {
    const docs = await getInboxModel()
      .find({ status: 'pending' })
      .sort({ receivedAt: 1 })
      .limit(limit)
      .lean();
    return docs.map((d) => this.toEntry(d));
  }

  async markProcessed(id: string): Promise<void> {
    const now = new Date();
    await getInboxModel().updateOne(
      { _id: id },
      { status: 'processed', processedAt: now, updatedAt: now },
    );
  }

  async markFailed(id: string, error: string, retryCount: number): Promise<void> {
    await getInboxModel().updateOne(
      { _id: id },
      { status: 'failed', lastError: error, retryCount, updatedAt: new Date() },
    );
  }

  private toEntry(doc: InboxDocument): InboxEntry {
    return {
      id: String(doc._id),
      eventId: doc.eventId,
      eventName: doc.eventName,
      event: this.deserializer.fromObject(doc.envelope),
      status: doc.status,
      retryCount: doc.retryCount,
      receivedAt: doc.receivedAt,
      processedAt: doc.processedAt,
      lastError: doc.lastError,
    };
  }
}
