import { describe, it, expect } from 'vitest';
import { MongoFilterBuilder } from '../../../src/infrastructure/persistence/query/MongoFilterBuilder.js';
import { FilterObject } from '../../../src/application/common/Filter.js';

describe('MongoFilterBuilder', () => {
  it('builds eq and in operators', () => {
    const filter = FilterObject.create().eq('status', 'active').in('type', ['a', 'b']).build();
    const mongo = MongoFilterBuilder.build(filter);
    expect(mongo).toEqual({
      $and: [{ status: 'active' }, { type: { $in: ['a', 'b'] } }],
    });
  });

  it('applies soft delete filter', () => {
    const mongo = MongoFilterBuilder.withSoftDelete({ status: 'active' });
    expect(mongo).toEqual({
      $and: [{ status: 'active' }, { isDeleted: { $ne: true } }],
    });
  });
});
