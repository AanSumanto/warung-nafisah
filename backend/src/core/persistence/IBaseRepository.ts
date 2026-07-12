import type { Identifier } from '../../domain/common/Identifier.js';
import type { FilterGroup } from '../../application/common/Filter.js';
import type { SortField } from '../../application/common/Sort.js';
import type { PaginationParams } from '../../application/common/Pagination.js';

export interface RepositoryFindOptions {
  readonly filter?: FilterGroup;
  readonly sort?: SortField[];
  readonly pagination?: PaginationParams;
}

export interface IBaseRepository<TEntity, TId extends Identifier = Identifier> {
  findById(id: TId): Promise<TEntity | null>;
  findAll(options?: RepositoryFindOptions): Promise<TEntity[]>;
  exists(id: TId): Promise<boolean>;
  save(entity: TEntity): Promise<TEntity>;
  delete(id: TId): Promise<void>;
}

export interface IReadRepository<TEntity, TId extends Identifier = Identifier> {
  findById(id: TId): Promise<TEntity | null>;
  findAll(options?: RepositoryFindOptions): Promise<TEntity[]>;
  exists(id: TId): Promise<boolean>;
  count(options?: Pick<RepositoryFindOptions, 'filter'>): Promise<number>;
}

export interface IWriteRepository<TEntity, TId extends Identifier = Identifier> {
  save(entity: TEntity): Promise<TEntity>;
  delete(id: TId): Promise<void>;
}

/** Sprint 2 alias — `IRepository` is the canonical persistence contract. */
export type IRepository<TEntity, TId extends Identifier = Identifier> = IBaseRepository<
  TEntity,
  TId
>;
