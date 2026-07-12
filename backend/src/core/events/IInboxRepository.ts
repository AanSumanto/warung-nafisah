import type { IDomainEvent } from '../../domain/events/IDomainEvent.js';

export type InboxStatus = 'pending' | 'processing' | 'processed' | 'failed';

export interface InboxEntry {
  readonly id: string;
  readonly eventId: string;
  readonly eventName: string;
  readonly event: IDomainEvent;
  readonly status: InboxStatus;
  readonly retryCount: number;
  readonly receivedAt: Date;
  readonly processedAt?: Date;
  readonly lastError?: string;
}

export interface IInboxRepository {
  receive(event: IDomainEvent, session?: unknown): Promise<InboxEntry>;
  findPending(limit?: number): Promise<InboxEntry[]>;
  markProcessed(id: string): Promise<void>;
  markFailed(id: string, error: string, retryCount: number): Promise<void>;
}
