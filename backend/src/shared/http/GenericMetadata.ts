import type { JsonObject } from '../types/common.js';

export interface GenericMetadata {
  readonly requestId: string;
  readonly correlationId?: string;
  readonly timestamp: string;
  readonly version?: string;
  readonly [key: string]: string | undefined;
}

export function createMetadata(
  requestId: string,
  extras?: Record<string, string | undefined>,
): GenericMetadata {
  return {
    requestId,
    timestamp: new Date().toISOString(),
    version: '1',
    ...extras,
  };
}

/** Sprint 2 alias */
export type Metadata = GenericMetadata;

export type { JsonObject };
