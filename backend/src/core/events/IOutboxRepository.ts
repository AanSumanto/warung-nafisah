import type { IDomainEvent } from '../../domain/events/IDomainEvent.js';

export type OutboxStatus = 'pending' | 'processing' | 'processed' | 'failed';

export interface OutboxEntry {
  readonly id: string;
  readonly eventId: string;
  readonly eventName: string;
  readonly event: IDomainEvent;
  readonly status: OutboxStatus;
  readonly retryCount: number;
  readonly createdAt: Date;
  readonly processedAt?: Date;
  readonly lastError?: string;
}

export interface IOutboxRepository {
  enqueue(event: IDomainEvent, session?: unknown): Promise<OutboxEntry>;
  findPending(limit?: number): Promise<OutboxEntry[]>;
  markProcessing(id: string): Promise<void>;
  markProcessed(id: string): Promise<void>;
  markFailed(id: string, error: string, retryCount: number): Promise<void>;
}
