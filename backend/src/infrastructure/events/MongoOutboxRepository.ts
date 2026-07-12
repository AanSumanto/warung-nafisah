import type { ClientSession } from 'mongoose';
import type { IDomainEvent } from '../../domain/events/IDomainEvent.js';
import type { IOutboxRepository, OutboxEntry } from '../../core/events/IOutboxRepository.js';
import { EventDeserializer, EventSerializer } from '../../application/events/EventSerializer.js';
import { getOutboxModel, type OutboxDocument } from './documents/EventDocuments.js';

export class MongoOutboxRepository implements IOutboxRepository {
  private readonly serializer = new EventSerializer();
  private readonly deserializer = new EventDeserializer();

  async enqueue(event: IDomainEvent, session?: unknown): Promise<OutboxEntry> {
    const now = new Date();
    const id = `outbox_${event.eventId}`;
    const envelope = this.serializer.toObject(event);

    const doc = {
      _id: id,
      eventId: event.eventId,
      eventName: event.eventName,
      envelope,
      status: 'pending' as const,
      retryCount: 0,
      createdAt: now,
      updatedAt: now,
    };

    await getOutboxModel().create([doc], { session: session as ClientSession | null });
    return this.toEntry(doc);
  }

  async findPending(limit = 50): Promise<OutboxEntry[]> {
    const docs = await getOutboxModel()
      .find({ status: 'pending' })
      .sort({ createdAt: 1 })
      .limit(limit)
      .lean();
    return docs.map((d) => this.toEntry(d));
  }

  async markProcessing(id: string): Promise<void> {
    await getOutboxModel().updateOne(
      { _id: id },
      { status: 'processing', updatedAt: new Date() },
    );
  }

  async markProcessed(id: string): Promise<void> {
    const now = new Date();
    await getOutboxModel().updateOne(
      { _id: id },
      { status: 'processed', processedAt: now, updatedAt: now },
    );
  }

  async markFailed(id: string, error: string, retryCount: number): Promise<void> {
    await getOutboxModel().updateOne(
      { _id: id },
      { status: 'failed', lastError: error, retryCount, updatedAt: new Date() },
    );
  }

  private toEntry(doc: OutboxDocument): OutboxEntry {
    return {
      id: String(doc._id),
      eventId: doc.eventId,
      eventName: doc.eventName,
      event: this.deserializer.fromObject(doc.envelope),
      status: doc.status,
      retryCount: doc.retryCount,
      createdAt: doc.createdAt,
      processedAt: doc.processedAt,
      lastError: doc.lastError,
    };
  }
}
