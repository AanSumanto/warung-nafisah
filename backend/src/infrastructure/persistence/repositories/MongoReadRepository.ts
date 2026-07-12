import type { Model, ClientSession } from 'mongoose';
import type { Identifier } from '../../../domain/common/Identifier.js';
import type {
  IReadRepository,
  RepositoryFindOptions,
} from '../../../core/persistence/IBaseRepository.js';
import type { MongoMapper } from '../mappers/MongoMapper.js';
import type { BaseDocument } from '../documents/BaseDocument.js';
import { MongoFilterBuilder } from '../query/MongoFilterBuilder.js';
import { MongoSortBuilder } from '../query/MongoSortBuilder.js';
import { MongoProjectionBuilder, type MongoProjection } from '../query/MongoProjectionBuilder.js';
import { MongoPaginationBuilder } from '../query/MongoPaginationBuilder.js';
import type { CursorPaginationParams } from '../../../application/common/CursorPagination.js';
import { MongoCursorPaginationBuilder } from '../query/MongoPaginationBuilder.js';

export interface MongoRepositoryOptions {
  readonly softDelete?: boolean;
  readonly idField?: string;
  readonly defaultProjection?: MongoProjection;
}

export class MongoReadRepository<
  TEntity,
  TDocument extends BaseDocument,
  TId extends Identifier = Identifier,
> implements IReadRepository<TEntity, TId>
{
  constructor(
    protected readonly model: Model<TDocument>,
    protected readonly mapper: MongoMapper<TEntity, TDocument>,
    protected readonly options: MongoRepositoryOptions = {},
    protected readonly getActiveSession?: () => ClientSession | null,
  ) {}

  async findById(id: TId): Promise<TEntity | null> {
    const filter = this.applySoftDelete({ _id: id });
    const doc = await this.model
      .findOne(filter)
      .session(this.getActiveSession?.() ?? null)
      .lean<TDocument>();
    return doc ? this.mapper.toDomain(doc) : null;
  }

  async findAll(options?: RepositoryFindOptions): Promise<TEntity[]> {
    const filter = this.buildFilter(options);
    const sort = MongoSortBuilder.build(options?.sort ?? []);
    const docs = await this.model
      .find(filter, this.options.defaultProjection)
      .sort(sort)
      .session(this.getActiveSession?.() ?? null)
      .lean<TDocument[]>();
    return docs.map((doc) => this.mapper.toDomain(doc));
  }

  async exists(id: TId): Promise<boolean> {
    const filter = this.applySoftDelete({ _id: id });
    const count = await this.model
      .countDocuments(filter)
      .session(this.getActiveSession?.() ?? null);
    return count > 0;
  }

  async count(options?: Pick<RepositoryFindOptions, 'filter'>): Promise<number> {
    const filter = this.buildFilter(options);
    return this.model.countDocuments(filter).session(this.getActiveSession?.() ?? null);
  }

  async findPage(
    options?: RepositoryFindOptions,
  ): Promise<{ items: TEntity[]; total: number }> {
    const filter = this.buildFilter(options);
    const { skip, limit } = MongoPaginationBuilder.offset(options?.pagination ?? {});
    const sort = MongoSortBuilder.build(options?.sort ?? []);

    const [docs, total] = await Promise.all([
      this.model
        .find(filter, this.options.defaultProjection)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .session(this.getActiveSession?.() ?? null)
        .lean<TDocument[]>(),
      this.model.countDocuments(filter).session(this.getActiveSession?.() ?? null),
    ]);

    return { items: docs.map((d) => this.mapper.toDomain(d)), total };
  }

  async findWithProjection(
    filter: Record<string, unknown>,
    projection: MongoProjection,
  ): Promise<TEntity[]> {
    const merged = this.applySoftDelete(filter);
    const docs = await this.model
      .find(merged, projection)
      .session(this.getActiveSession?.() ?? null)
      .lean<TDocument[]>();
    return docs.map((doc) => this.mapper.toDomain(doc));
  }

  async findCursorPage(options: {
    filter?: RepositoryFindOptions['filter'];
    sort?: RepositoryFindOptions['sort'];
    cursor?: Partial<CursorPaginationParams>;
    cursorField?: string;
  }): Promise<{ items: TEntity[]; hasMore: boolean; params: CursorPaginationParams }> {
    const params = MongoCursorPaginationBuilder.normalize(options.cursor ?? {});
    const baseFilter = this.buildFilter({ filter: options.filter });
    const cursorData = MongoCursorPaginationBuilder.decodeCursor(params.cursor);
    const cursorFilter = MongoCursorPaginationBuilder.buildCursorFilter(
      cursorData,
      options.cursorField ?? '_id',
    );
    const filter = { ...baseFilter, ...cursorFilter };
    const sort = MongoSortBuilder.build(options.sort ?? []);

    const docs = await this.model
      .find(filter, this.options.defaultProjection)
      .sort(sort)
      .limit(params.limit + 1)
      .session(this.getActiveSession?.() ?? null)
      .lean<TDocument[]>();

    const hasMore = docs.length > params.limit;
    const slice = hasMore ? docs.slice(0, params.limit) : docs;
    return {
      items: slice.map((doc) => this.mapper.toDomain(doc)),
      hasMore,
      params,
    };
  }

  protected buildFilter(options?: Pick<RepositoryFindOptions, 'filter'>): Record<string, unknown> {
    const base = options?.filter ? MongoFilterBuilder.build(options.filter) : {};
    return this.applySoftDelete(base);
  }

  protected applySoftDelete(filter: Record<string, unknown>): Record<string, unknown> {
    if (!this.options.softDelete) return filter;
    return MongoFilterBuilder.withSoftDelete(filter);
  }
}

export { MongoProjectionBuilder };
