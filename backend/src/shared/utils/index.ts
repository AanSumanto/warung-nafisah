import type { Maybe, Nullable, Optional } from '../types/common.js';

export function isDefined<T>(value: Maybe<T>): value is T {
  return value !== null && value !== undefined;
}

export function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

export function assertNever(value: never): never {
  throw new Error(`Unexpected value: ${String(value)}`);
}

export function pick<T extends object, K extends keyof T>(obj: T, keys: readonly K[]): Pick<T, K> {
  const result = {} as Pick<T, K>;
  for (const key of keys) {
    result[key] = obj[key];
  }
  return result;
}

export function omit<T extends object, K extends keyof T>(obj: T, keys: readonly K[]): Omit<T, K> {
  const exclude = new Set<keyof T>(keys);
  const result = {} as Omit<T, K>;
  for (const key of Object.keys(obj) as (keyof T)[]) {
    if (!exclude.has(key)) {
      (result as T)[key] = obj[key];
    }
  }
  return result;
}

export function coalesce<T>(...values: Optional<T>[]): Nullable<T> {
  for (const value of values) {
    if (value !== undefined) return value;
  }
  return null;
}
