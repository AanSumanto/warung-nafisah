export type SortDirection = 'asc' | 'desc';

export interface SortField {
  readonly field: string;
  readonly direction: SortDirection;
}

export class SortObject {
  private readonly fields: SortField[] = [];

  static create(): SortObject {
    return new SortObject();
  }

  asc(field: string): this {
    this.fields.push({ field, direction: 'asc' });
    return this;
  }

  desc(field: string): this {
    this.fields.push({ field, direction: 'desc' });
    return this;
  }

  build(): SortField[] {
    return [...this.fields];
  }

  isEmpty(): boolean {
    return this.fields.length === 0;
  }
}

export function sortArray<T extends Record<string, unknown>>(
  items: T[],
  sortFields: SortField[],
): T[] {
  if (sortFields.length === 0) return [...items];

  return [...items].sort((a, b) => {
    for (const { field, direction } of sortFields) {
      const aVal = a[field];
      const bVal = b[field];
      if (aVal === bVal) continue;
      const cmp = compareValues(aVal, bVal);
      return direction === 'asc' ? cmp : -cmp;
    }
    return 0;
  });
}

function compareValues(a: unknown, b: unknown): number {
  if (a == null && b == null) return 0;
  if (a == null) return -1;
  if (b == null) return 1;
  if (typeof a === 'string' && typeof b === 'string') return a.localeCompare(b);
  if (typeof a === 'number' && typeof b === 'number') return a - b;
  if (a instanceof Date && b instanceof Date) return a.getTime() - b.getTime();
  return String(a).localeCompare(String(b));
}
