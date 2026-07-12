import type { IFailedEventLog, FailedEventLogEntry } from '../../core/events/IDeadLetterQueue.js';
import { getFailedEventModel } from './documents/EventDocuments.js';

export class MongoFailedEventLog implements IFailedEventLog {
  async log(
    entry: Omit<FailedEventLogEntry, 'id' | 'failedAt'>,
  ): Promise<FailedEventLogEntry> {
    const now = new Date();
    const id = `fail_${entry.eventId}_${entry.handlerName ?? 'global'}_${now.getTime()}`;

    await getFailedEventModel().create({
      _id: id,
      eventId: entry.eventId,
      eventName: entry.eventName,
      handlerName: entry.handlerName,
      error: entry.error,
      retryCount: entry.retryCount,
      failedAt: now,
      context: entry.context,
      createdAt: now,
      updatedAt: now,
    });

    return { id, ...entry, failedAt: now };
  }

  async findRecent(limit = 100): Promise<FailedEventLogEntry[]> {
    const docs = await getFailedEventModel().find().sort({ failedAt: -1 }).limit(limit).lean();
    return docs.map((d) => ({
      id: String(d._id),
      eventId: d.eventId,
      eventName: d.eventName,
      handlerName: d.handlerName,
      error: d.error,
      retryCount: d.retryCount,
      failedAt: d.failedAt,
      context: d.context,
    }));
  }
}
