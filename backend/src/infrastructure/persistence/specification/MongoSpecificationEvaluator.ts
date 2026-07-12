import type { FilterGroup } from '../../../application/common/Filter.js';
import type { ISpecification } from '../../../core/persistence/Specification.js';
import { Specification } from '../../../core/persistence/Specification.js';
import { MongoFilterBuilder, type MongoFilter } from '../query/MongoFilterBuilder.js';

export class FilterSpecification<T> extends Specification<T> {
  constructor(private readonly filter: FilterGroup) {
    super();
  }

  isSatisfiedBy(_candidate: T): boolean {
    throw new Error('FilterSpecification is for MongoDB query translation only');
  }

  toFilterGroup(): FilterGroup {
    return this.filter;
  }
}

export class MongoSpecificationEvaluator {
  static toMongoFilter<T>(spec: ISpecification<T>): MongoFilter {
    if (typeof spec.toFilterGroup === 'function') {
      return MongoFilterBuilder.build(spec.toFilterGroup());
    }
    throw new Error(
      'Specification must implement toFilterGroup() for MongoDB persistence evaluation',
    );
  }

  static fromFilterGroup<T>(filter: FilterGroup): ISpecification<T> {
    return new FilterSpecification<T>(filter);
  }
}
