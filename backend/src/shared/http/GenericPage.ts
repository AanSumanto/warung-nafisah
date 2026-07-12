import type { PaginationMeta } from '../../application/common/Pagination.js';
import type { CursorPaginationMeta } from '../../application/common/CursorPagination.js';

export interface GenericPage<T> {
  readonly items: T[];
  readonly meta: PaginationMeta;
}

export interface GenericCursorPage<T> {
  readonly items: T[];
  readonly meta: CursorPaginationMeta;
}

export function toGenericPage<T>(items: T[], meta: PaginationMeta): GenericPage<T> {
  return { items, meta };
}

export function toGenericCursorPage<T>(
  items: T[],
  meta: CursorPaginationMeta,
): GenericCursorPage<T> {
  return { items, meta };
}

/** Sprint 2 alias */
export type PageResult<T> = GenericPage<T>;
export type CursorPageResult<T> = GenericCursorPage<T>;
