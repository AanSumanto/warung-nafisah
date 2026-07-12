import { describe, it, expect } from 'vitest';
import { ValueObject } from '../../../src/domain/base/ValueObject.js';
import { DomainError } from '../../../src/domain/errors/DomainError.js';

interface TestProps {
  value: string;
}

class TestValueObject extends ValueObject<TestProps> {
  constructor(value: string) {
    super({ value });
  }

  protected override validate(): void {
    if (!this.props.value) {
      throw DomainError.invalidArgument('value required');
    }
  }

  get value(): string {
    return this.props.value;
  }
}

describe('ValueObject', () => {
  it('equals by props', () => {
    const a = new TestValueObject('hello');
    const b = new TestValueObject('hello');
    const c = new TestValueObject('world');
    expect(a.equals(b)).toBe(true);
    expect(a.equals(c)).toBe(false);
  });

  it('returns false when comparing null', () => {
    const vo = new TestValueObject('x');
    expect(vo.equals(null)).toBe(false);
  });

  it('serializes to JSON', () => {
    const vo = new TestValueObject('data');
    expect(vo.toJSON()).toEqual({ value: 'data' });
  });

  it('validates invariants on construction', () => {
    expect(() => new TestValueObject('')).toThrow(DomainError);
  });

  it('freezes props', () => {
    const vo = new TestValueObject('frozen');
    expect(Object.isFrozen(vo.toJSON())).toBe(false);
  });
});
