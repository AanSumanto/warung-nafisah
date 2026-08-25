import { normalizeMongoId } from '../normalizeMongoId.js';

export interface MongoMapper<TEntity, TDocument> {
  toDocument(entity: TEntity): TDocument;
  toDomain(document: TDocument): TEntity;
  toDocumentPartial?(entity: Partial<TEntity>): Partial<TDocument>;
}

export abstract class BaseMongoMapper<TEntity, TDocument> implements MongoMapper<TEntity, TDocument> {
  abstract toDocument(entity: TEntity): TDocument;
  abstract toDomain(document: TDocument): TEntity;

  protected documentId(document: { readonly _id: unknown }): string {
    return normalizeMongoId(document._id);
  }

  toDocumentPartial(entity: Partial<TEntity>): Partial<TDocument> {
    return entity as unknown as Partial<TDocument>;
  }
}
