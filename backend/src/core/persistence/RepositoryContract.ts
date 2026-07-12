import type { IBaseRepository } from './IBaseRepository.js';
import type { Identifier } from '../../domain/common/Identifier.js';

/**
 * Repository contract — documents standard persistence operations for all modules.
 * MongoDB implementations: MongoRepository (Sprint 3B).
 */
export interface RepositoryContract<TEntity, TId extends Identifier = Identifier>
  extends IBaseRepository<TEntity, TId> {
  readonly aggregateName: string;
}

export abstract class BaseRepositoryContract<TEntity, TId extends Identifier = Identifier>
  implements RepositoryContract<TEntity, TId>
{
  abstract readonly aggregateName: string;

  abstract findById(id: TId): Promise<TEntity | null>;
  abstract findAll(options?: import('../persistence/IBaseRepository.js').RepositoryFindOptions): Promise<TEntity[]>;
  abstract exists(id: TId): Promise<boolean>;
  abstract save(entity: TEntity): Promise<TEntity>;
  abstract delete(id: TId): Promise<void>;
}
