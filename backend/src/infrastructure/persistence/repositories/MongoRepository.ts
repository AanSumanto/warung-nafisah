import type { Model, ClientSession } from 'mongoose';
import type { Identifier } from '../../../domain/common/Identifier.js';
import type {
  IRepository,
  RepositoryFindOptions,
} from '../../../core/persistence/IBaseRepository.js';
import type { CursorPaginationParams } from '../../../application/common/CursorPagination.js';
import type { MongoMapper } from '../mappers/MongoMapper.js';
import type { BaseDocument } from '../documents/BaseDocument.js';
import {
  MongoReadRepository,
  type MongoRepositoryOptions,
} from './MongoReadRepository.js';
import { MongoWriteRepository } from './MongoWriteRepository.js';
import { MongoPaginationBuilder } from '../query/MongoPaginationBuilder.js';
import { MongoCursorPaginationBuilder } from '../query/MongoPaginationBuilder.js';
import { toMongoPageResult, toMongoCursorPageResult } from '../MongoPageResult.js';
import type { MongoTransaction } from '../../database/MongoTransactionManager.js';

export class MongoRepository<
  TEntity extends { id: TId },
  TDocument extends BaseDocument,
  TId extends Identifier = Identifier,
> implements IRepository<TEntity, TId>
{
  private readonly readRepo: MongoReadRepository<TEntity, TDocument, TId>;
  private readonly writeRepo: MongoWriteRepository<TEntity, TDocument, TId>;

  constructor(
    model: Model<TDocument>,
    mapper: MongoMapper<TEntity, TDocument>,
    options: MongoRepositoryOptions = {},
    getActiveSession?: () => ClientSession | null,
  ) {
    this.readRepo = new MongoReadRepository(model, mapper, options, getActiveSession);
    this.writeRepo = new MongoWriteRepository(model, mapper, options, getActiveSession);
  }

  findById(id: TId): Promise<TEntity | null> {
    return this.readRepo.findById(id);
  }

  findAll(options?: RepositoryFindOptions): Promise<TEntity[]> {
    return this.readRepo.findAll(options);
  }

  exists(id: TId): Promise<boolean> {
    return this.readRepo.exists(id);
  }

  save(entity: TEntity): Promise<TEntity> {
    return this.writeRepo.save(entity);
  }

  delete(id: TId): Promise<void> {
    return this.writeRepo.delete(id);
  }

  count(options?: Pick<RepositoryFindOptions, 'filter'>): Promise<number> {
    return this.readRepo.count(options);
  }

  async findPaginated(options?: RepositoryFindOptions) {
    const { items, total } = await this.readRepo.findPage(options);
    const { params } = MongoPaginationBuilder.offset(options?.pagination ?? {});
    const meta = MongoPaginationBuilder.buildMeta(params, total);
    return toMongoPageResult(items, meta);
  }

  async findCursorPaginated(options: {
    filter?: RepositoryFindOptions['filter'];
    sort?: RepositoryFindOptions['sort'];
    cursor?: Partial<CursorPaginationParams>;
    cursorField?: string;
  }) {
    const cursorField = options.cursorField ?? '_id';
    const { items, hasMore, params } = await this.readRepo.findCursorPage(options);
    const nextCursor =
      hasMore && items.length > 0
        ? MongoCursorPaginationBuilder.encodeCursor({
            [cursorField]: String(items[items.length - 1]!.id),
          })
        : null;
    const meta = {
      limit: params.limit,
      nextCursor,
      previousCursor: params.cursor ?? null,
      hasMore,
    };
    return toMongoCursorPageResult(items, meta);
  }

  hardDelete(id: TId, transaction?: MongoTransaction): Promise<void> {
    return this.writeRepo.hardDelete(id, transaction);
  }
}

export { MongoReadRepository, MongoWriteRepository, type MongoRepositoryOptions };
