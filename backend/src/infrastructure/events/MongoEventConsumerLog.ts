import type { IEventConsumerLog, ConsumerLogEntry } from '../../core/events/IEventConsumerLog.js';
import { getConsumerLogModel } from './documents/EventDocuments.js';

export class MongoEventConsumerLog implements IEventConsumerLog {
  async isProcessed(eventId: string, handlerName: string): Promise<boolean> {
    const id = this.buildId(eventId, handlerName);
    const doc = await getConsumerLogModel().findById(id).lean();
    return Boolean(doc);
  }

  async record(eventId: string, handlerName: string): Promise<ConsumerLogEntry> {
    const now = new Date();
    const id = this.buildId(eventId, handlerName);
    const doc = {
      _id: id,
      eventId,
      handlerName,
      processedAt: now,
      createdAt: now,
      updatedAt: now,
    };
    await getConsumerLogModel().updateOne({ _id: id }, doc, { upsert: true });
    return { id, eventId, handlerName, processedAt: now };
  }

  private buildId(eventId: string, handlerName: string): string {
    return `${eventId}:${handlerName}`;
  }
}
