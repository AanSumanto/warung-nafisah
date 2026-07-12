import { describe, it, expect } from 'vitest';
import { Result } from '../../../src/domain/common/Result.js';
import { DomainError } from '../../../src/domain/errors/DomainError.js';

describe('Result<T>', () => {
  it('creates ok result', () => {
    const result = Result.ok(42);
    expect(Result.isOk(result)).toBe(true);
    expect(result.value).toBe(42);
  });

  it('creates fail result', () => {
    const error = DomainError.invalidArgument('bad');
    const result = Result.fail(error);
    expect(Result.isFail(result)).toBe(true);
    expect(result.error).toBe(error);
  });

  it('maps ok values', () => {
    const result = Result.map(Result.ok(2), (n) => n * 3);
    expect(Result.unwrap(result)).toBe(6);
  });

  it('flatMaps chained results', () => {
    const result = Result.flatMap(Result.ok(5), (n) =>
      n > 0 ? Result.ok(n + 1) : Result.fail('negative'),
    );
    expect(Result.unwrap(result)).toBe(6);
  });

  it('unwrapOr returns fallback on failure', () => {
    const result = Result.fail(new Error('fail'));
    expect(Result.unwrapOr(result, 99)).toBe(99);
  });

  it('combine aggregates ok results', () => {
    const combined = Result.combine([Result.ok(1), Result.ok(2), Result.ok(3)] as const);
    expect(Result.unwrap(combined)).toEqual([1, 2, 3]);
  });

  it('combine short-circuits on first failure', () => {
    const combined = Result.combine([
      Result.ok(1),
      Result.fail('error'),
      Result.ok(3),
    ] as const);
    expect(Result.isFail(combined)).toBe(true);
  });
});
