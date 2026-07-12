import type { IDomainEvent } from '../../domain/events/IDomainEvent.js';
import { BaseProjection } from './ProjectionRegistry.js';

export interface AuditTimelineEntry {
  readonly eventId: string;
  readonly eventName: string;
  readonly aggregateId: string;
  readonly aggregateType: string;
  readonly occurredAt: Date;
  readonly summary: string;
  readonly metadata?: Record<string, unknown>;
}

/**
 * Generic audit timeline projection framework — no business-specific entries.
 */
export class AuditTimelineProjection extends BaseProjection {
  readonly projectionName = 'audit-timeline';
  readonly eventNames: readonly string[] = ['*'];

  private readonly entries: AuditTimelineEntry[] = [];

  async project(event: IDomainEvent): Promise<void> {
    this.entries.push({
      eventId: event.eventId,
      eventName: event.eventName,
      aggregateId: event.aggregateId,
      aggregateType: event.aggregateType,
      occurredAt: event.occurredAt,
      summary: `${event.aggregateType}:${event.eventName}`,
      metadata: event.metadata as Record<string, unknown> | undefined,
    });
  }

  getEntries(): readonly AuditTimelineEntry[] {
    return [...this.entries];
  }

  clear(): void {
    this.entries.length = 0;
  }
}
