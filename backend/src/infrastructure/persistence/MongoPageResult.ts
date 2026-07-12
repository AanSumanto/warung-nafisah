import type {
  CursorPaginatedResult,
  CursorPaginationMeta,
} from '../../application/common/CursorPagination.js';
import type { PaginatedResult, PaginationMeta } from '../../application/common/Pagination.js';

export type MongoPageResult<T> = PaginatedResult<T>;
export type MongoCursorPageResult<T> = CursorPaginatedResult<T>;

export function toMongoPageResult<T>(items: T[], meta: PaginationMeta): MongoPageResult<T> {
  return { items, meta };
}

export function toMongoCursorPageResult<T>(
  items: T[],
  meta: CursorPaginationMeta,
): MongoCursorPageResult<T> {
  return { items, meta };
}
