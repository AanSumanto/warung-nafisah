import type { IDomainEvent } from '../../domain/events/IDomainEvent.js';

export interface IProjection<T extends IDomainEvent = IDomainEvent> {
  readonly projectionName: string;
  readonly eventNames: readonly string[];
  project(event: T): Promise<void>;
}

export abstract class BaseProjection<T extends IDomainEvent = IDomainEvent> implements IProjection<T> {
  abstract readonly projectionName: string;
  abstract readonly eventNames: readonly string[];
  abstract project(event: T): Promise<void>;

  supports(event: IDomainEvent): boolean {
    return this.eventNames.includes(event.eventName);
  }
}

export class ProjectionRegistry {
  private readonly projections: IProjection[] = [];

  register(projection: IProjection): this {
    if (this.projections.some((p) => p.projectionName === projection.projectionName)) {
      throw new Error(`Projection ${projection.projectionName} already registered`);
    }
    this.projections.push(projection);
    return this;
  }

  getForEvent(eventName: string): readonly IProjection[] {
    return this.projections.filter(
      (p) => p.eventNames.includes(eventName) || p.eventNames.includes('*'),
    );
  }

  async projectAll(event: IDomainEvent): Promise<void> {
    const targets = this.getForEvent(event.eventName);
    for (const projection of targets) {
      await projection.project(event);
    }
  }

  list(): readonly IProjection[] {
    return [...this.projections];
  }

  clear(): void {
    this.projections.length = 0;
  }
}
