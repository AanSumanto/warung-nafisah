import { describe, it, expect } from 'vitest';
import { Either } from '../../../src/domain/common/Either.js';

describe('Either', () => {
  it('creates left and right values', () => {
    const left = Either.left('error');
    const right = Either.right(42);

    expect(Either.isLeft(left)).toBe(true);
    expect(Either.isRight(right)).toBe(true);
    expect(left.value).toBe('error');
    expect(right.value).toBe(42);
  });

  it('maps right values', () => {
    const result = Either.map(Either.right(2), (n) => n * 3);
    expect(Either.isRight(result)).toBe(true);
    if (Either.isRight(result)) {
      expect(result.value).toBe(6);
    }
  });

  it('skips map on left', () => {
    const result = Either.map(Either.left('fail'), (n: number) => n * 3);
    expect(Either.isLeft(result)).toBe(true);
    if (Either.isLeft(result)) {
      expect(result.value).toBe('fail');
    }
  });

  it('maps left values with mapLeft', () => {
    const result = Either.mapLeft(Either.left('err'), (msg) => `wrapped: ${msg}`);
    expect(Either.fold(result, (l) => l, () => 'right')).toBe('wrapped: err');
  });

  it('folds to a single value', () => {
    const left = Either.fold(Either.left('bad'), (l) => `L:${l}`, (r) => `R:${r}`);
    const right = Either.fold(Either.right(7), (l) => `L:${l}`, (r) => `R:${r}`);

    expect(left).toBe('L:bad');
    expect(right).toBe('R:7');
  });
});
