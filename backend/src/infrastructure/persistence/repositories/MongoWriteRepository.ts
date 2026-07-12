import type { Model, ClientSession } from 'mongoose';
import type { Identifier } from '../../../domain/common/Identifier.js';
import type { IWriteRepository } from '../../../core/persistence/IBaseRepository.js';
import type { MongoMapper } from '../mappers/MongoMapper.js';
import type { BaseDocument, SoftDeleteDocument } from '../documents/BaseDocument.js';
import type { MongoRepositoryOptions } from './MongoReadRepository.js';
import type { MongoTransaction } from '../../database/MongoTransactionManager.js';

export class MongoWriteRepository<
  TEntity,
  TDocument extends BaseDocument,
  TId extends Identifier = Identifier,
> implements IWriteRepository<TEntity, TId>
{
  constructor(
    protected readonly model: Model<TDocument>,
    protected readonly mapper: MongoMapper<TEntity, TDocument>,
    protected readonly options: MongoRepositoryOptions = {},
    protected readonly getActiveSession?: () => ClientSession | null,
  ) {}

  async save(entity: TEntity): Promise<TEntity> {
    const document = this.mapper.toDocument(entity);
    const session = this.getActiveSession?.() ?? null;
    const id = (document as BaseDocument)._id;

    const updated = await this.model
      .findByIdAndUpdate(id, document as Record<string, unknown>, {
        upsert: true,
        new: true,
        session,
        runValidators: true,
      })
      .lean<TDocument>();

    if (!updated) {
      throw new Error(`Failed to save document with id ${id}`);
    }

    return this.mapper.toDomain(updated);
  }

  async delete(id: TId): Promise<void> {
    const session = this.getActiveSession?.() ?? null;

    if (this.options.softDelete) {
      await this.model
        .findByIdAndUpdate(
          id,
          { isDeleted: true, deletedAt: new Date() } satisfies Partial<SoftDeleteDocument>,
          { session },
        )
        .lean();
      return;
    }

    await this.model.findByIdAndDelete(id).session(session);
  }

  async hardDelete(id: TId, transaction?: MongoTransaction): Promise<void> {
    await this.model.findByIdAndDelete(id).session(transaction?.session ?? null);
  }
}
