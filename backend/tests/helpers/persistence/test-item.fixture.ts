import { Schema, model, type Model } from 'mongoose';
import type { SoftDeleteDocument } from '../../../src/infrastructure/persistence/documents/BaseDocument.js';
import { BaseMongoMapper } from '../../../src/infrastructure/persistence/mappers/MongoMapper.js';
import { createIdentifier, type Identifier } from '../../../src/domain/common/Identifier.js';

export interface TestItemProps {
  name: string;
  value: number;
}

export class TestItem {
  constructor(
    readonly id: Identifier,
    readonly name: string,
    readonly value: number,
    readonly createdAt: Date,
    readonly updatedAt: Date,
  ) {}

  static create(name: string, value: number, id?: Identifier): TestItem {
    const now = new Date();
    return new TestItem(id ?? createIdentifier(crypto.randomUUID()), name, value, now, now);
  }
}

export interface TestItemDocument extends SoftDeleteDocument {
  name: string;
  value: number;
}

const testItemSchema = new Schema<TestItemDocument>(
  {
    _id: { type: String, required: true },
    name: { type: String, required: true },
    value: { type: Number, required: true },
    createdAt: { type: Date, required: true },
    updatedAt: { type: Date, required: true },
    deletedAt: { type: Date, default: null },
    isDeleted: { type: Boolean, default: false },
  },
  { collection: 'test_items', versionKey: false },
);

export function getTestItemModel(): Model<TestItemDocument> {
  return model<TestItemDocument>('TestItem', testItemSchema);
}

export class TestItemMapper extends BaseMongoMapper<TestItem, TestItemDocument> {
  toDocument(entity: TestItem): TestItemDocument {
    return {
      _id: entity.id,
      name: entity.name,
      value: entity.value,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      deletedAt: null,
      isDeleted: false,
    };
  }

  toDomain(document: TestItemDocument): TestItem {
    return new TestItem(
      createIdentifier(document._id),
      document.name,
      document.value,
      document.createdAt,
      document.updatedAt,
    );
  }
}
