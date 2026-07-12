export interface PaginationParams {
  readonly page: number;
  readonly limit: number;
}

export interface PaginationMeta {
  readonly page: number;
  readonly limit: number;
  readonly total: number;
  readonly totalPages: number;
  readonly hasNextPage: boolean;
  readonly hasPreviousPage: boolean;
}

export interface PaginatedResult<T> {
  readonly items: T[];
  readonly meta: PaginationMeta;
}

export const PaginationDefaults = {
  page: 1,
  limit: 20,
  maxLimit: 100,
} as const;

export function normalizePagination(params: Partial<PaginationParams>): PaginationParams {
  const page = Math.max(1, params.page ?? PaginationDefaults.page);
  const limit = Math.min(
    PaginationDefaults.maxLimit,
    Math.max(1, params.limit ?? PaginationDefaults.limit),
  );
  return { page, limit };
}

export function buildPaginationMeta(
  params: PaginationParams,
  total: number,
): PaginationMeta {
  const totalPages = Math.max(1, Math.ceil(total / params.limit));
  return {
    page: params.page,
    limit: params.limit,
    total,
    totalPages,
    hasNextPage: params.page < totalPages,
    hasPreviousPage: params.page > 1,
  };
}

export function paginateArray<T>(
  items: T[],
  params: PaginationParams,
): PaginatedResult<T> {
  const { page, limit } = params;
  const start = (page - 1) * limit;
  const slice = items.slice(start, start + limit);
  return {
    items: slice,
    meta: buildPaginationMeta(params, items.length),
  };
}

export function getSkip(params: PaginationParams): number {
  return (params.page - 1) * params.limit;
}
