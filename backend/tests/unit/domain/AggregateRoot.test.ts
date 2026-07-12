import { describe, it, expect } from 'vitest';
import { AggregateRoot } from '../../../src/domain/base/AggregateRoot.js';
import { createIdentifier } from '../../../src/domain/common/Identifier.js';
import type { IDomainEvent } from '../../../src/domain/events/IDomainEvent.js';

class TestAggregate extends AggregateRoot<{ status: string }> {
  constructor(id = createIdentifier('agg_1')) {
    super({ status: 'draft' }, id);
  }

  activate(): void {
    this.props.status = 'active';
    this.addDomainEvent({
      eventId: 'evt_1',
      eventName: 'TestActivated',
      eventVersion: 1,
      aggregateId: this.id,
      aggregateType: 'TestAggregate',
      occurredAt: new Date(),
      payload: { status: 'active' },
    });
  }
}

describe('AggregateRoot', () => {
  it('collects domain events', () => {
    const aggregate = new TestAggregate();
    aggregate.activate();
    expect(aggregate.hasDomainEvents()).toBe(true);
    expect(aggregate.domainEvents).toHaveLength(1);
    expect(aggregate.domainEvents[0]?.eventName).toBe('TestActivated');
  });

  it('clears domain events after pull', () => {
    const aggregate = new TestAggregate();
    aggregate.activate();
    const events: IDomainEvent[] = aggregate.clearDomainEvents();
    expect(events).toHaveLength(1);
    expect(aggregate.hasDomainEvents()).toBe(false);
  });

  it('inherits entity identity', () => {
    const aggregate = new TestAggregate(createIdentifier('agg_99'));
    expect(aggregate.id).toBe('agg_99');
  });
});
