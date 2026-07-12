import type { SortField } from '../../../application/common/Sort.js';

export type MongoSort = Record<string, 1 | -1>;

export class MongoSortBuilder {
  static build(fields: SortField[]): MongoSort {
    if (fields.length === 0) return { createdAt: -1 };
    return Object.fromEntries(fields.map((f) => [f.field, f.direction === 'asc' ? 1 : -1]));
  }
}
