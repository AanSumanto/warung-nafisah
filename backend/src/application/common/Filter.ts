export type FilterOperator =
  | 'eq'
  | 'ne'
  | 'gt'
  | 'gte'
  | 'lt'
  | 'lte'
  | 'in'
  | 'nin'
  | 'contains'
  | 'startsWith'
  | 'endsWith'
  | 'exists';

export interface FilterCondition {
  readonly field: string;
  readonly operator: FilterOperator;
  readonly value: unknown;
}

export interface FilterGroup {
  readonly logic: 'and' | 'or';
  readonly conditions: FilterCondition[];
}

export class FilterObject {
  private readonly conditions: FilterCondition[] = [];
  private logic: 'and' | 'or' = 'and';

  static create(): FilterObject {
    return new FilterObject();
  }

  where(field: string, operator: FilterOperator, value: unknown): this {
    this.conditions.push({ field, operator, value });
    return this;
  }

  eq(field: string, value: unknown): this {
    return this.where(field, 'eq', value);
  }

  in(field: string, values: unknown[]): this {
    return this.where(field, 'in', values);
  }

  or(): this {
    this.logic = 'or';
    return this;
  }

  and(): this {
    this.logic = 'and';
    return this;
  }

  build(): FilterGroup {
    return { logic: this.logic, conditions: [...this.conditions] };
  }

  isEmpty(): boolean {
    return this.conditions.length === 0;
  }
}

export function matchesFilter(
  record: Record<string, unknown>,
  filter: FilterGroup,
): boolean {
  if (filter.conditions.length === 0) return true;

  const evaluators = filter.conditions.map((c) => evaluateCondition(record, c));
  return filter.logic === 'and' ? evaluators.every(Boolean) : evaluators.some(Boolean);
}

function evaluateCondition(record: Record<string, unknown>, condition: FilterCondition): boolean {
  const fieldValue = record[condition.field];
  switch (condition.operator) {
    case 'eq':
      return fieldValue === condition.value;
    case 'ne':
      return fieldValue !== condition.value;
    case 'gt':
      return (fieldValue as number) > (condition.value as number);
    case 'gte':
      return (fieldValue as number) >= (condition.value as number);
    case 'lt':
      return (fieldValue as number) < (condition.value as number);
    case 'lte':
      return (fieldValue as number) <= (condition.value as number);
    case 'in':
      return Array.isArray(condition.value) && condition.value.includes(fieldValue);
    case 'nin':
      return Array.isArray(condition.value) && !condition.value.includes(fieldValue);
    case 'contains':
      return String(fieldValue).includes(String(condition.value));
    case 'startsWith':
      return String(fieldValue).startsWith(String(condition.value));
    case 'endsWith':
      return String(fieldValue).endsWith(String(condition.value));
    case 'exists':
      return condition.value ? fieldValue !== undefined && fieldValue !== null : fieldValue == null;
    default:
      return false;
  }
}
