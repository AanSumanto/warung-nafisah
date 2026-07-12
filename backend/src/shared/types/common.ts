export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;
export type Maybe<T> = T | null | undefined;

export type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P];
};

export type Brand<T, B extends string> = T & { readonly __brand: B };

export interface Timestamps {
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface SoftDeletable {
  readonly deletedAt: Date | null;
}

export type Primitive = string | number | boolean | bigint | null | undefined;

export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

export type JsonObject = { [key: string]: JsonValue };
