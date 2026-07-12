export type MongoProjection = Record<string, 0 | 1>;

export class MongoProjectionBuilder {
  static include(fields: readonly string[]): MongoProjection {
    return Object.fromEntries(fields.map((field) => [field, 1]));
  }

  static exclude(fields: readonly string[]): MongoProjection {
    return Object.fromEntries(fields.map((field) => [field, 0]));
  }
}
