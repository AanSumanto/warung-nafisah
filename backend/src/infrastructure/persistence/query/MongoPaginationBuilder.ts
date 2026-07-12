import {
  buildPaginationMeta,
  getSkip,
  normalizePagination,
  type PaginationParams,
} from '../../../application/common/Pagination.js';
import {
  Base64CursorCodec,
  buildCursorMeta,
  normalizeCursorPagination,
  type CursorPaginationParams,
} from '../../../application/common/CursorPagination.js';

export class MongoPaginationBuilder {
  static offset(params: Partial<PaginationParams>): { skip: number; limit: number; params: PaginationParams } {
    const normalized = normalizePagination(params);
    return { skip: getSkip(normalized), limit: normalized.limit, params: normalized };
  }

  static buildMeta(params: PaginationParams, total: number) {
    return buildPaginationMeta(params, total);
  }
}

export class MongoCursorPaginationBuilder {
  static normalize(params: Partial<CursorPaginationParams>) {
    return normalizeCursorPagination(params);
  }

  static decodeCursor(cursor?: string): Record<string, unknown> | null {
    if (!cursor) return null;
    try {
      return Base64CursorCodec.decode(cursor);
    } catch {
      return { _id: cursor };
    }
  }

  static encodeCursor(value: Record<string, unknown>): string {
    return Base64CursorCodec.encode(value);
  }

  static buildCursorFilter(
    cursor: Record<string, unknown> | null,
    cursorField = '_id',
  ): Record<string, unknown> {
    if (!cursor) return {};
    return { [cursorField]: { $gt: cursor[cursorField] } };
  }

  static buildMeta<T extends { id: string }>(
    items: T[],
    params: CursorPaginationParams,
    hasMore: boolean,
  ) {
    return buildCursorMeta(items, params, hasMore);
  }
}
