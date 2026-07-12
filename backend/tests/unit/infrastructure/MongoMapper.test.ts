import { describe, it, expect } from 'vitest';
import { TestItemMapper } from '../../helpers/persistence/test-item.fixture.js';
import { TestItem } from '../../helpers/persistence/test-item.fixture.js';

describe('MongoMapper', () => {
  const mapper = new TestItemMapper();

  it('maps entity to document and back', () => {
    const entity = TestItem.create('Widget', 42);
    const document = mapper.toDocument(entity);
    const restored = mapper.toDomain(document);

    expect(document._id).toBe(entity.id);
    expect(document.name).toBe('Widget');
    expect(restored.name).toBe('Widget');
    expect(restored.value).toBe(42);
  });
});
