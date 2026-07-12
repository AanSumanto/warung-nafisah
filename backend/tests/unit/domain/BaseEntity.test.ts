import { describe, it, expect } from 'vitest';
import { BaseEntity } from '../../../src/domain/base/BaseEntity.js';
import { createIdentifier } from '../../../src/domain/common/Identifier.js';

class TestEntity extends BaseEntity<{ name: string }> {
  constructor(name: string, id = createIdentifier('ent_1')) {
    super({ name }, id);
  }

  get name(): string {
    return this.props.name;
  }

  rename(name: string): void {
    this.props.name = name;
    this.touch();
  }
}

describe('BaseEntity', () => {
  it('exposes id and timestamps', () => {
    const entity = new TestEntity('Nasi Goreng');
    expect(entity.id).toBe('ent_1');
    expect(entity.createdAt).toBeInstanceOf(Date);
    expect(entity.updatedAt).toBeInstanceOf(Date);
  });

  it('equals by id', () => {
    const a = new TestEntity('A', createIdentifier('same'));
    const b = new TestEntity('B', createIdentifier('same'));
    const c = new TestEntity('C', createIdentifier('other'));
    expect(a.equals(b)).toBe(true);
    expect(a.equals(c)).toBe(false);
  });

  it('updates updatedAt on touch', () => {
    const entity = new TestEntity('Item');
    const before = entity.updatedAt.getTime();
    entity.rename('Updated');
    expect(entity.updatedAt.getTime()).toBeGreaterThanOrEqual(before);
    expect(entity.name).toBe('Updated');
  });
});
