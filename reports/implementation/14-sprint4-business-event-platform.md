# Sprint 4 — Business Event Platform Implementation

**Document ID:** WN-IMPL-S4-001  
**Version:** 0.9.0  
**Date:** 2026-07-11  
**Status:** Complete — Awaiting Approval

---

## 1. Objective

Build the **Business Event Platform** as the foundation for Event-Driven Architecture across all ERP modules. Every business action will eventually create exactly one immutable, append-only Business Event.

**This sprint builds the platform only — no business handlers or modules.**

---

## 2. Deliverables

### Domain (`backend/src/domain/events/`)

| Component | Status |
|-----------|--------|
| `BaseDomainEvent` | ✅ Immutable, frozen, append-only |
| `BusinessEvent` | ✅ Factory `BusinessEvent.create()` |
| `EventMetadata` | ✅ Correlation / causation / user context |
| `EventEnvelope` | ✅ Stored event wrapper |
| `EventVersion` | ✅ Version value object |
| `IDomainEvent` | ✅ Retained from Sprint 2 |

### Core Ports (`backend/src/core/events/`)

| Component | Status |
|-----------|--------|
| `IEventStore` / `StoredEventRecord` | ✅ |
| `IOutboxRepository` | ✅ |
| `IInboxRepository` | ✅ |
| `IEventConsumerLog` | ✅ Idempotency |
| `IDeadLetterQueue` / `IFailedEventLog` | ✅ |
| `EventRetryPolicy` | ✅ Exponential backoff |

### Application (`backend/src/application/events/`)

| Component | Status |
|-----------|--------|
| `EventPublisher` | ✅ Enqueue to outbox |
| `InProcessEventDispatcher` | ✅ In-process handler dispatch |
| `EventRegistry` | ✅ Handler registration |
| `IEventHandler` / `BaseEventHandler` | ✅ Handler contract |
| `EventSerializer` / `EventDeserializer` | ✅ JSON round-trip |
| `ProjectionRegistry` | ✅ Generic projection framework |
| `AuditTimelineProjection` | ✅ Generic audit timeline (no business logic) |

### Infrastructure (`backend/src/infrastructure/events/`)

| Component | Status |
|-----------|--------|
| `MongoEventStore` (`EventStoreRepository`) | ✅ Append-only `business_events` |
| `MongoOutboxRepository` | ✅ `event_outbox` |
| `MongoInboxRepository` | ✅ `event_inbox` |
| `MongoEventConsumerLog` | ✅ `event_consumer_log` |
| `MongoDeadLetterQueue` | ✅ `event_dead_letter` |
| `MongoFailedEventLog` | ✅ `event_failed_log` |
| `EventPersistence` | ✅ Outbox → store → inbox → dispatch |
| `OutboxDispatcher` | ✅ Pending outbox processor |
| `EventDocuments` | ✅ Mongoose schemas (6 collections) |

### MongoDB Collections

| Collection | Purpose |
|------------|---------|
| `business_events` | Immutable event store |
| `event_outbox` | Outbox pattern (transactional publish) |
| `event_inbox` | Inbox pattern (at-least-once receive) |
| `event_consumer_log` | Handler idempotency (`eventId` + `handlerName`) |
| `event_dead_letter` | Permanently failed handler events |
| `event_failed_log` | Failed dispatch / handler audit trail |

---

## 3. Architecture

- **Clean Architecture** — domain has zero mongoose imports ✅
- **DDD** — `BusinessEvent` as domain event primitive
- **Outbox Pattern** — publish within MongoDB transaction, dispatch after commit
- **Inbox Pattern** — receive tracking with processed / failed status
- **Idempotency** — `EventConsumerLog` prevents duplicate handler execution
- **Append Only** — events never updated or deleted
- **In-Process Dispatcher** — no RabbitMQ / Kafka / Redis Streams (deferred)
- **Dependency Injection** — platform composed via constructor injection in tests

---

## 4. Event Flow

```
Aggregate / Command
       ↓
EventPublisher.publish(event, session?)
       ↓
MongoOutboxRepository.enqueue()  ← within UoW transaction
       ↓
Commit
       ↓
OutboxDispatcher.dispatchPending()
       ↓
EventPersistence.persistFromOutbox()
       ├─ MongoEventStore.append()
       ├─ MongoInboxRepository.receive()
       ├─ InProcessEventDispatcher.dispatch()
       └─ ProjectionRegistry.projectAll()
```

---

## 5. Testing

| Area | Tests |
|------|-------|
| Outbox publish in transaction | ✅ |
| Persist + dispatch | ✅ |
| Idempotency | ✅ |
| Serialization | ✅ |
| Dead letter queue | ✅ |
| Inbox processed status | ✅ |
| Projection registration | ✅ |
| Event immutability | ✅ |

**Total:** 77/77 Vitest (8 new integration tests)

---

## 6. Not In Scope (Explicit)

- SaleCompleted / Inventory / Finance / Dashboard handlers
- POS, Purchase, Authentication modules
- RabbitMQ, Kafka, Redis Streams
- Business-specific projections

---

## 7. Related Documents

| Document | Path |
|----------|------|
| ADR-003 | `reports/architecture/ADR-003-business-event-platform.md` |
| Architecture | `reports/architecture/business-event-platform.md` |
| Verification | `reports/verification/10-sprint4-verification.md` |
| Test Results | `reports/testing/11-sprint4-test-results.md` |
| Checklist | `reports/todo/sprint4-todo.md` |

---

**STOP — Awaiting Sprint 4 approval before business modules.**
