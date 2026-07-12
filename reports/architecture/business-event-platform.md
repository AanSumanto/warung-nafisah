# Business Event Platform — Architecture

**Document ID:** WN-ARCH-EVENT-001  
**Version:** 0.9.0  
**Date:** 2026-07-11  
**Sprint:** 4 — Business Event Platform

---

## 1. Overview

The Business Event Platform is the shared Event-Driven Architecture foundation for Warung Nafisah ERP. It ensures every future business action produces exactly one immutable, append-only `BusinessEvent` that is durably stored, reliably dispatched, and safely projected.

**Platform only — no business module handlers in Sprint 4.**

---

## 2. Layer Map

| Layer | Path | Responsibility |
|-------|------|----------------|
| Domain | `backend/src/domain/events/` | Event primitives, immutability |
| Core | `backend/src/core/events/` | Ports (interfaces), retry policy |
| Application | `backend/src/application/events/` | Publisher, dispatcher, registry, projections |
| Infrastructure | `backend/src/infrastructure/events/` | MongoDB adapters, persistence orchestration |

---

## 3. Architecture Diagram

```mermaid
flowchart LR
    subgraph CommandSide["Command Side"]
        CMD[Command Handler]
        AGG[Aggregate Root]
        UoW[MongoUnitOfWork]
    end

    subgraph EventPlatform["Business Event Platform"]
        PUB[EventPublisher]
        OUT[(event_outbox)]
        DISP[OutboxDispatcher]
        STORE[(business_events)]
        IN[(event_inbox)]
        DPT[InProcessEventDispatcher]
        REG[EventRegistry]
        PROJ[ProjectionRegistry]
    end

    subgraph Reliability["Reliability"]
        RETRY[EventRetryPolicy]
        LOG[(event_consumer_log)]
        DLQ[(event_dead_letter)]
        FAIL[(event_failed_log)]
    end

    CMD --> AGG
    AGG --> PUB
    PUB --> OUT
    UoW -.->|transaction| OUT
    DISP --> STORE
    DISP --> IN
    DISP --> DPT
    DPT --> REG
    DPT --> LOG
    DPT --> RETRY
    DPT --> DLQ
    DPT --> FAIL
    DISP --> PROJ
```

---

## 4. Event Lifecycle

```mermaid
sequenceDiagram
    participant Agg as Aggregate
    participant Pub as EventPublisher
    participant Out as event_outbox
    participant UoW as MongoUnitOfWork
    participant Disp as OutboxDispatcher
    participant Store as business_events
    participant In as event_inbox
    participant Dpt as Dispatcher
    participant H as EventHandler
    participant Pr as Projection

    Agg->>Pub: publish(event, session)
    Pub->>Out: enqueue (pending)
    UoW->>UoW: commit transaction
    Disp->>Out: findPending()
    Disp->>Store: append(event)
    Disp->>In: receive(event)
    Disp->>Dpt: dispatch(event)
    Dpt->>H: handle(event) [idempotent]
    Disp->>Pr: projectAll(event)
    Disp->>In: markProcessed()
    Disp->>Out: markProcessed()
```

**Immutability rules:**

- `BusinessEvent` is `Object.freeze()` at creation
- `business_events` — insert only, no update/delete APIs
- Payload and metadata are frozen recursively

---

## 5. Outbox Flow

```mermaid
flowchart TD
    A[Business action completes] --> B[EventPublisher.publish within UoW]
    B --> C[event_outbox status=pending]
    C --> D{Transaction commit?}
    D -->|Yes| E[OutboxDispatcher.dispatchPending]
    D -->|No| F[Rollback — outbox entry discarded]
    E --> G[markProcessing]
    G --> H[Append to business_events]
    H --> I[Receive in event_inbox]
    I --> J[Dispatch handlers + projections]
    J --> K[markProcessed on outbox + inbox]
    J -->|Failure| L[markFailed + failed_log]
```

**Why outbox:** Guarantees the event is not lost if the aggregate write commits but the process crashes before dispatch.

---

## 6. Inbox Flow

```mermaid
flowchart TD
    A[Outbox entry processed] --> B[inbox.receive — status=pending]
    B --> C[Dispatcher runs handlers]
    C -->|Success| D[markProcessed]
    C -->|Failure after retries| E[markFailed]
    D --> F[findPending returns empty for this event]
    E --> G[Failed log + optional DLQ from handler layer]
```

**Idempotent receive:** `inbox_${eventId}` — duplicate receive returns existing entry without error.

---

## 7. Dispatcher Flow

```mermaid
flowchart TD
    A[InProcessEventDispatcher.dispatch] --> B[EventRegistry.getHandlers eventName]
    B --> C{For each handler}
    C --> D{ConsumerLog.isProcessed?}
    D -->|Yes| E[Skip — idempotent]
    D -->|No| F[RetryPolicy.execute handler.handle]
    F -->|Success| G[ConsumerLog.record]
    F -->|Failure| H[FailedEventLog.log]
    H --> I[DeadLetterQueue.enqueue]
    I --> J[Throw — bubble to persistence layer]
```

---

## 8. Retry Flow

```mermaid
flowchart TD
    A[Handler or dispatch step fails] --> B{Attempt < maxAttempts?}
    B -->|Yes| C[Exponential backoff delay]
    C --> D[Retry same operation]
    B -->|No| E[Permanent failure]
    E --> F[FailedEventLog]
    E --> G[DeadLetterQueue if handler-level]
    E --> H[Outbox/Inbox markFailed]
```

**Default policy:** `maxAttempts: 2`, `baseDelayMs: 10` (configurable per platform instance).

---

## 9. Dead Letter Flow

```mermaid
flowchart TD
    A[Handler throws after retries exhausted] --> B[FailedEventLog.log with handlerName]
    B --> C[DeadLetterQueue.enqueue]
    C --> D[(event_dead_letter)]
    D --> E[Manual replay — future sprint]
```

DLQ entries store the full serialized event envelope for operational recovery.

---

## 10. Projection Flow

```mermaid
flowchart TD
    A[Event successfully dispatched] --> B[ProjectionRegistry.projectAll]
    B --> C{For each registered projection}
    C --> D{projection.canProject eventName?}
    D -->|Yes| E[projection.project event]
    D -->|No| F[Skip]
```

**Sprint 4 deliverable:** `AuditTimelineProjection` — generic in-memory audit timeline framework. No business-specific read models.

---

## 11. Audit Flow

```mermaid
flowchart LR
    EV[BusinessEvent] --> ATP[AuditTimelineProjection]
    ATP --> ENT[AuditEntry: eventId, eventName, aggregateId, occurredAt]
    ENT --> MEM[(In-memory timeline — Sprint 4)]
    ENT -.->|Future| DB[(audit_timeline read model)]
```

Business modules will register domain-specific audit enrichments in future sprints without modifying the platform core.

---

## 12. MongoDB Collections

| Collection | Indexes | Notes |
|------------|---------|-------|
| `business_events` | `eventName`, `aggregateId`, `aggregateType` | `_id = eventId` |
| `event_outbox` | `eventId`, `status` | `_id = outbox_{eventId}` |
| `event_inbox` | `eventId`, `status` | `_id = inbox_{eventId}` |
| `event_consumer_log` | `eventId`, `handlerName` | `_id = {eventId}:{handlerName}` |
| `event_dead_letter` | `eventId`, `handlerName` | Append on failure |
| `event_failed_log` | `eventId` | All failure types |

---

## 13. Integration Points (Future Sprints)

| Consumer | Uses |
|----------|------|
| POS module | `EventPublisher`, `EventRegistry` |
| Inventory module | Handler + projection registration |
| Finance module | Handler + projection registration |
| Dashboard | Read projections (not built in Sprint 4) |
| Jobs / BullMQ | `OutboxDispatcher.dispatchPending()` poller |

---

## 14. Related Documents

- [ADR-003](./ADR-003-business-event-platform.md)
- [Implementation Report](../implementation/14-sprint4-business-event-platform.md)
- [Event-Driven Architecture](./09-event-driven-architecture.md)
- [Event Store Layer](./12-event-store-layer.md)
- [Projection Strategy](./15-projection-strategy.md)
