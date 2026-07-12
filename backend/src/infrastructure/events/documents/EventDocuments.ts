import { Schema, model, type Model, type ClientSession } from 'mongoose';
import type { SerializedEvent } from '../../../application/events/EventSerializer.js';

export interface StoredEventDocument {
  _id: string;
  eventName: string;
  eventVersion: number;
  aggregateId: string;
  aggregateType: string;
  occurredAt: Date;
  storedAt: Date;
  payload: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  sequence?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface OutboxDocument {
  _id: string;
  eventId: string;
  eventName: string;
  envelope: SerializedEvent;
  status: 'pending' | 'processing' | 'processed' | 'failed';
  retryCount: number;
  processedAt?: Date;
  lastError?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface InboxDocument {
  _id: string;
  eventId: string;
  eventName: string;
  envelope: SerializedEvent;
  status: 'pending' | 'processing' | 'processed' | 'failed';
  retryCount: number;
  receivedAt: Date;
  processedAt?: Date;
  lastError?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ConsumerLogDocument {
  _id: string;
  eventId: string;
  handlerName: string;
  processedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface DeadLetterDocument {
  _id: string;
  eventId: string;
  eventName: string;
  handlerName: string;
  envelope: SerializedEvent;
  error: string;
  retryCount: number;
  failedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface FailedEventDocument {
  _id: string;
  eventId: string;
  eventName: string;
  handlerName?: string;
  error: string;
  retryCount: number;
  failedAt: Date;
  context?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const storedEventSchema = new Schema(
  {
    _id: { type: String, required: true },
    eventName: { type: String, required: true, index: true },
    eventVersion: { type: Number, required: true },
    aggregateId: { type: String, required: true, index: true },
    aggregateType: { type: String, required: true, index: true },
    occurredAt: { type: Date, required: true },
    storedAt: { type: Date, required: true },
    payload: { type: Schema.Types.Mixed, required: true },
    metadata: { type: Schema.Types.Mixed },
    sequence: { type: Number },
    createdAt: { type: Date, required: true },
    updatedAt: { type: Date, required: true },
  },
  { collection: 'business_events', versionKey: false },
);

const outboxSchema = new Schema(
  {
    _id: { type: String, required: true },
    eventId: { type: String, required: true, index: true },
    eventName: { type: String, required: true },
    envelope: { type: Schema.Types.Mixed, required: true },
    status: { type: String, required: true, index: true, default: 'pending' },
    retryCount: { type: Number, default: 0 },
    processedAt: { type: Date },
    lastError: { type: String },
    createdAt: { type: Date, required: true },
    updatedAt: { type: Date, required: true },
  },
  { collection: 'event_outbox', versionKey: false },
);

const inboxSchema = new Schema(
  {
    _id: { type: String, required: true },
    eventId: { type: String, required: true, index: true },
    eventName: { type: String, required: true },
    envelope: { type: Schema.Types.Mixed, required: true },
    status: { type: String, required: true, index: true, default: 'pending' },
    retryCount: { type: Number, default: 0 },
    receivedAt: { type: Date, required: true },
    processedAt: { type: Date },
    lastError: { type: String },
    createdAt: { type: Date, required: true },
    updatedAt: { type: Date, required: true },
  },
  { collection: 'event_inbox', versionKey: false },
);

const consumerLogSchema = new Schema(
  {
    _id: { type: String, required: true },
    eventId: { type: String, required: true, index: true },
    handlerName: { type: String, required: true, index: true },
    processedAt: { type: Date, required: true },
    createdAt: { type: Date, required: true },
    updatedAt: { type: Date, required: true },
  },
  { collection: 'event_consumer_log', versionKey: false },
);

const deadLetterSchema = new Schema(
  {
    _id: { type: String, required: true },
    eventId: { type: String, required: true, index: true },
    eventName: { type: String, required: true },
    handlerName: { type: String, required: true },
    envelope: { type: Schema.Types.Mixed, required: true },
    error: { type: String, required: true },
    retryCount: { type: Number, required: true },
    failedAt: { type: Date, required: true },
    createdAt: { type: Date, required: true },
    updatedAt: { type: Date, required: true },
  },
  { collection: 'event_dead_letter', versionKey: false },
);

const failedEventSchema = new Schema(
  {
    _id: { type: String, required: true },
    eventId: { type: String, required: true, index: true },
    eventName: { type: String, required: true },
    handlerName: { type: String },
    error: { type: String, required: true },
    retryCount: { type: Number, required: true },
    failedAt: { type: Date, required: true },
    context: { type: Schema.Types.Mixed },
    createdAt: { type: Date, required: true },
    updatedAt: { type: Date, required: true },
  },
  { collection: 'event_failed_log', versionKey: false },
);

export function getStoredEventModel(): Model<StoredEventDocument> {
  return model<StoredEventDocument>('StoredEvent', storedEventSchema);
}

export function getOutboxModel(): Model<OutboxDocument> {
  return model<OutboxDocument>('EventOutbox', outboxSchema);
}

export function getInboxModel(): Model<InboxDocument> {
  return model<InboxDocument>('EventInbox', inboxSchema);
}

export function getConsumerLogModel(): Model<ConsumerLogDocument> {
  return model<ConsumerLogDocument>('EventConsumerLog', consumerLogSchema);
}

export function getDeadLetterModel(): Model<DeadLetterDocument> {
  return model<DeadLetterDocument>('EventDeadLetter', deadLetterSchema);
}

export function getFailedEventModel(): Model<FailedEventDocument> {
  return model<FailedEventDocument>('EventFailedLog', failedEventSchema);
}

export type { ClientSession };
