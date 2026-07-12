import type { AuditTimelineProjection } from '../../application/events/AuditTimelineProjection.js';
import type { createEventPlatform } from '../events/EventPlatformFactory.js';

export type EventPlatform = ReturnType<typeof createEventPlatform> & {
  auditProjection: AuditTimelineProjection;
};
