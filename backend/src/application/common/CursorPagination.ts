export interface CursorPaginationParams {
  readonly cursor?: string;
  readonly limit: number;
}

export interface CursorPaginationMeta {
  readonly limit: number;
  readonly nextCursor: string | null;
  readonly previousCursor: string | null;
  readonly hasMore: boolean;
}

export interface CursorPaginatedResult<T> {
  readonly items: T[];
  readonly meta: CursorPaginationMeta;
}

export const CursorPaginationDefaults = {
  limit: 20,
  maxLimit: 100,
} as const;

export function normalizeCursorPagination(
  params: Partial<CursorPaginationParams>,
): CursorPaginationParams {
  const limit = Math.min(
    CursorPaginationDefaults.maxLimit,
    Math.max(1, params.limit ?? CursorPaginationDefaults.limit),
  );
  return { cursor: params.cursor, limit };
}

export function buildCursorMeta<T extends { id: string }>(
  items: T[],
  params: CursorPaginationParams,
  hasMore: boolean,
): CursorPaginationMeta {
  return {
    limit: params.limit,
    nextCursor: hasMore && items.length > 0 ? items[items.length - 1]!.id : null,
    previousCursor: params.cursor ?? null,
    hasMore,
  };
}

export interface CursorCodec {
  encode(value: Record<string, unknown>): string;
  decode(cursor: string): Record<string, unknown>;
}

export const Base64CursorCodec: CursorCodec = {
  encode(value) {
    return Buffer.from(JSON.stringify(value)).toString('base64url');
  },
  decode(cursor) {
    return JSON.parse(Buffer.from(cursor, 'base64url').toString('utf8')) as Record<string, unknown>;
  },
};
