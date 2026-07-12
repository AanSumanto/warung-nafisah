export interface EventMetadata {
  readonly correlationId?: string;
  readonly causationId?: string;
  readonly userId?: string;
  readonly source?: string;
  readonly [key: string]: string | undefined;
}

export function createEventMetadata(
  partial: EventMetadata = {},
): Readonly<EventMetadata> {
  return Object.freeze({ ...partial });
}
