import { describe, it, expect } from 'vitest';
import { MongoSpecificationEvaluator } from '../../../src/infrastructure/persistence/specification/MongoSpecificationEvaluator.js';
import { FilterObject } from '../../../src/application/common/Filter.js';

describe('MongoSpecificationEvaluator', () => {
  it('converts filter specification to mongo query', () => {
    const filter = FilterObject.create().eq('name', 'test').build();
    const spec = MongoSpecificationEvaluator.fromFilterGroup(filter);
    const mongo = MongoSpecificationEvaluator.toMongoFilter(spec);
    expect(mongo).toEqual({ $and: [{ name: 'test' }] });
  });
});
