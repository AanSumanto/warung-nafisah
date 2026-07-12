export type Left<L> = { readonly tag: 'left'; readonly value: L };
export type Right<R> = { readonly tag: 'right'; readonly value: R };

export type Either<L, R> = Left<L> | Right<R>;

export const Either = {
  left<L, R = never>(value: L): Either<L, R> {
    return { tag: 'left', value };
  },

  right<L = never, R = unknown>(value: R): Either<L, R> {
    return { tag: 'right', value };
  },

  isLeft<L, R>(either: Either<L, R>): either is Left<L> {
    return either.tag === 'left';
  },

  isRight<L, R>(either: Either<L, R>): either is Right<R> {
    return either.tag === 'right';
  },

  map<L, R, U>(either: Either<L, R>, fn: (value: R) => U): Either<L, U> {
    if (either.tag === 'right') {
      return Either.right(fn(either.value));
    }
    return either;
  },

  mapLeft<L, R, F>(either: Either<L, R>, fn: (value: L) => F): Either<F, R> {
    if (either.tag === 'left') {
      return Either.left(fn(either.value));
    }
    return either;
  },

  fold<L, R, T>(either: Either<L, R>, onLeft: (l: L) => T, onRight: (r: R) => T): T {
    return either.tag === 'left' ? onLeft(either.value) : onRight(either.value);
  },
};
