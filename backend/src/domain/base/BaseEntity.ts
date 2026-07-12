import type { Identifier } from '../common/Identifier.js';

export interface EntityProps {
  id: Identifier;
  createdAt: Date;
  updatedAt: Date;
}

export abstract class BaseEntity<T extends Record<string, unknown> = Record<string, unknown>> {
  protected readonly _id: Identifier;
  protected _createdAt: Date;
  protected _updatedAt: Date;
  protected readonly props: T;

  protected constructor(props: T, id: Identifier, createdAt?: Date, updatedAt?: Date) {
    this._id = id;
    const now = new Date();
    this._createdAt = createdAt ?? now;
    this._updatedAt = updatedAt ?? now;
    this.props = props;
  }

  get id(): Identifier {
    return this._id;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  protected touch(): void {
    this._updatedAt = new Date();
  }

  equals(other?: BaseEntity<T> | null): boolean {
    if (!other) return false;
    if (other === this) return true;
    return this._id === other._id;
  }
}

/** Sprint 2 alias — `Entity` is the canonical DDD name for `BaseEntity`. */
export { BaseEntity as Entity };
