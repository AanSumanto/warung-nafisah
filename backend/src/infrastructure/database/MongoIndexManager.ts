import type { Connection } from 'mongoose';

export type MongoIndexType = 'unique' | 'compound' | 'text' | 'ttl' | 'partial';

export interface MongoIndexSpec {
  readonly name?: string;
  readonly keys: Record<string, 1 | -1 | 'text' | '2dsphere' | 'hashed'>;
  readonly options?: Record<string, unknown>;
  readonly type?: MongoIndexType;
}

export class MongoIndexManager {
  constructor(private readonly connection: Connection) {}

  async ensureIndexes(collectionName: string, specs: MongoIndexSpec[]): Promise<string[]> {
    const collection = this.connection.collection(collectionName);
    const created: string[] = [];

    for (const spec of specs) {
      const options = this.buildOptions(spec);
      const name = await collection.createIndex(spec.keys, options);
      created.push(name);
    }

    return created;
  }

  async dropIndex(collectionName: string, indexName: string): Promise<void> {
    await this.connection.collection(collectionName).dropIndex(indexName);
  }

  async listIndexes(collectionName: string): Promise<Record<string, unknown>[]> {
    return this.connection.collection(collectionName).indexes();
  }

  private buildOptions(spec: MongoIndexSpec): Record<string, unknown> {
    const base: Record<string, unknown> = { ...spec.options, name: spec.name };

    switch (spec.type) {
      case 'unique':
        return { ...base, unique: true };
      case 'text':
        return { ...base };
      case 'ttl':
        return { ...base, expireAfterSeconds: spec.options?.expireAfterSeconds ?? 0 };
      case 'partial':
        return { ...base, partialFilterExpression: spec.options?.partialFilterExpression };
      case 'compound':
      default:
        return base;
    }
  }
}
