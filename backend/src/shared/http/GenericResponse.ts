import type { GenericMetadata } from './GenericMetadata.js';

export interface GenericResponse<T> {
  readonly success: true;
  readonly data: T;
  readonly meta: GenericMetadata;
}

export interface GenericErrorResponse {
  readonly success: false;
  readonly error: {
    readonly code: string;
    readonly message: string;
    readonly details?: Record<string, unknown>;
    readonly requestId: string;
    readonly timestamp: string;
  };
}

export type GenericApiResponse<T> = GenericResponse<T> | GenericErrorResponse;

export function createGenericResponse<T>(data: T, meta: GenericMetadata): GenericResponse<T> {
  return { success: true, data, meta };
}

/** Sprint 2 aliases */
export type ApiResponse<T> = GenericApiResponse<T>;
export type SuccessResponse<T> = GenericResponse<T>;
export type ErrorResponse = GenericErrorResponse;
