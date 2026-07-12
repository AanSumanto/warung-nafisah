export abstract class ValueObject<T extends object> {
  protected readonly props: Readonly<T>;

  protected constructor(props: T) {
    this.props = Object.freeze({ ...props });
    this.validate();
  }

  protected validate(): void {
    // Override in subclasses for invariant checks
  }

  equals(other?: ValueObject<T> | null): boolean {
    if (!other) return false;
    if (other === this) return true;
    return ValueObject.shallowEqual(this.props, other.props);
  }

  protected static shallowEqual(a: object, b: object): boolean {
    const recordA = a as Record<string, unknown>;
    const recordB = b as Record<string, unknown>;
    const keysA = Object.keys(recordA);
    const keysB = Object.keys(recordB);
    if (keysA.length !== keysB.length) return false;
    return keysA.every((key) => Object.is(recordA[key], recordB[key]));
  }

  toJSON(): T {
    return { ...(this.props as T) };
  }
}
