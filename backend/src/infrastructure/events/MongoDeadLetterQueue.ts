import type { IDeadLetterQueue, DeadLetterEntry } from '../../core/events/IDeadLetterQueue.js';
import { EventDeserializer } from '../../application/events/EventSerializer.js';
import { getDeadLetterModel } from './documents/EventDocuments.js';

export class MongoDeadLetterQueue implements IDeadLetterQueue {
  private readonly deserializer = new EventDeserializer();

  async enqueue(
    entry: Omit<DeadLetterEntry, 'id' | 'failedAt'>,
  ): Promise<DeadLetterEntry> {
    const now = new Date();
    const id = `dlq_${entry.eventId}_${entry.handlerName}`;
    const envelope = {
      eventId: entry.event.eventId,
      eventName: entry.event.eventName,
      eventVersion: entry.event.eventVersion,
      aggregateId: entry.event.aggregateId,
      aggregateType: entry.event.aggregateType,
      occurredAt: entry.event.occurredAt.toISOString(),
      payload: entry.event.payload,
      metadata: entry.event.metadata as Record<string, unknown> | undefined,
    };

    await getDeadLetterModel().updateOne(
      { _id: id },
      {
        _id: id,
        eventId: entry.eventId,
        eventName: entry.eventName,
        handlerName: entry.handlerName,
        envelope,
        error: entry.error,
        retryCount: entry.retryCount,
        failedAt: now,
        createdAt: now,
        updatedAt: now,
      },
      { upsert: true },
    );

    return { id, ...entry, failedAt: now };
  }

  async findAll(limit = 100): Promise<DeadLetterEntry[]> {
    const docs = await getDeadLetterModel().find().sort({ failedAt: -1 }).limit(limit).lean();
    return docs.map((d) => ({
      id: String(d._id),
      eventId: d.eventId,
      eventName: d.eventName,
      handlerName: d.handlerName,
      event: this.deserializer.fromObject(d.envelope),
      error: d.error,
      retryCount: d.retryCount,
      failedAt: d.failedAt,
    }));
  }
}
