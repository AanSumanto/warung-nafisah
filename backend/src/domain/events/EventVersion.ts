export class EventVersion {
  readonly value: number;

  constructor(value: number) {
    if (!Number.isInteger(value) || value < 1) {
      throw new Error('EventVersion must be a positive integer');
    }
    this.value = value;
    Object.freeze(this);
  }

  static initial(): EventVersion {
    return new EventVersion(1);
  }

  next(): EventVersion {
    return new EventVersion(this.value + 1);
  }

  equals(other: EventVersion): boolean {
    return this.value === other.value;
  }
}
