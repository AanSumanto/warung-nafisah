import type { IDomainEvent } from '../../domain/events/IDomainEvent.js';

export interface DeadLetterEntry {
  readonly id: string;
  readonly eventId: string;
  readonly eventName: string;
  readonly handlerName: string;
  readonly event: IDomainEvent;
  readonly error: string;
  readonly retryCount: number;
  readonly failedAt: Date;
}

export interface IDeadLetterQueue {
  enqueue(entry: Omit<DeadLetterEntry, 'id' | 'failedAt'>): Promise<DeadLetterEntry>;
  findAll(limit?: number): Promise<DeadLetterEntry[]>;
}

export interface FailedEventLogEntry {
  readonly id: string;
  readonly eventId: string;
  readonly eventName: string;
  readonly handlerName?: string;
  readonly error: string;
  readonly retryCount: number;
  readonly failedAt: Date;
  readonly context?: Record<string, unknown>;
}

export interface IFailedEventLog {
  log(entry: Omit<FailedEventLogEntry, 'id' | 'failedAt'>): Promise<FailedEventLogEntry>;
  findRecent(limit?: number): Promise<FailedEventLogEntry[]>;
}
