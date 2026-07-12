export type Result<T, E = Error> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: E };

export const Result = {
  ok<T>(value: T): Result<T, never> {
    return { ok: true, value };
  },

  fail<E>(error: E): Result<never, E> {
    return { ok: false, error };
  },

  isOk<T, E>(result: Result<T, E>): result is { ok: true; value: T } {
    return result.ok;
  },

  isFail<T, E>(result: Result<T, E>): result is { ok: false; error: E } {
    return !result.ok;
  },

  map<T, U, E>(result: Result<T, E>, fn: (value: T) => U): Result<U, E> {
    if (result.ok) {
      return Result.ok(fn(result.value));
    }
    return result;
  },

  mapError<T, E, F>(result: Result<T, E>, fn: (error: E) => F): Result<T, F> {
    if (!result.ok) {
      return Result.fail(fn(result.error));
    }
    return result;
  },

  flatMap<T, U, E>(result: Result<T, E>, fn: (value: T) => Result<U, E>): Result<U, E> {
    if (result.ok) {
      return fn(result.value);
    }
    return result;
  },

  unwrap<T, E>(result: Result<T, E>): T {
    if (result.ok) {
      return result.value;
    }
    throw result.error;
  },

  unwrapOr<T, E>(result: Result<T, E>, fallback: T): T {
    return result.ok ? result.value : fallback;
  },

  combine<T extends readonly Result<unknown, unknown>[]>(
    results: T,
  ): Result<
    { [K in keyof T]: T[K] extends Result<infer V, unknown> ? V : never },
    T[number] extends Result<unknown, infer E> ? E : never
  > {
    const values: unknown[] = [];
    for (const result of results) {
      if (!result.ok) {
        return result as Result<never, T[number] extends Result<unknown, infer E> ? E : never>;
      }
      values.push(result.value);
    }
    return Result.ok(values) as Result<
      { [K in keyof T]: T[K] extends Result<infer V, unknown> ? V : never },
      never
    >;
  },
};
