# Event-Driven Architecture & Business Event DNA

**Project:** Warung Nafisah ERP  
**Document ID:** WN-EDA-001  
**Version:** 1.1.0  
**Status:** Draft — Awaiting Approval (Phase 0 Revision)

---

## 1. Core Architectural DNA

> **"Every business action creates a permanent business event."**

This is not a logging feature — it is the **foundational principle** of Warung Nafisah ERP and the shared DNA across all enterprise applications in this ecosystem (Bettazon, SIDEMANG, Lambidaro, trading systems).

### What This Means

| Traditional POS | Warung Nafisah ERP |
|-----------------|-------------------|
| Sale updates `orders` collection | Sale **persists** `orders` **and** emits immutable `SaleCompleted` business event |
| Inventory decremented inline | `InventoryConsumed` event consumed by Inventory module |
| Dashboard totals updated manually or via cron | Dashboard subscribes to events and updates read models |
| Audit = optional log table | Audit timeline **is** the business event stream |
| AI needs ETL pipelines | AI reads structured event stream directly |
| Offline sync = conflict hell | Events are the sync unit — ordered, idempotent, replayable |

### Properties of a Business Event

Every event stored in `business_events` collection:

| Property | Description |
|----------|-------------|
| **Immutable** | Insert-only; never updated or deleted |
| **Permanent** | Retained per retention policy (minimum 7 years financial) |
| **Ordered** | `sequenceNumber` per outlet/stream for causal ordering |
| **Idempotent** | `eventId` (UUID) prevents duplicate processing |
| **Scoped** | `businessGroupId`, `businessId`, `outletId`, `warehouseId` |
| **Typed** | `eventType` enum (e.g. `SaleCompleted`) |
| **Versioned** | `eventSchemaVersion` for forward compatibility |
| **Attributed** | `actorId`, `actorRole`, `deviceId`, `shiftId` |
| **Payload** | Full domain snapshot — what happened and why |
| **Causation** | `correlationId`, `causationId` for tracing chains |
| **Replayable** | Consumers can rebuild read models from event stream |

---

## 2. Architecture Pattern

**Internal Event-Driven Architecture** within a modular monolith. Not microservices — but event-driven module boundaries.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         PRESENTATION LAYER                              │
│              Next.js │ POS │ KDS │ Dashboard │ Approvals                │
└─────────────────────────────────┬───────────────────────────────────────┘
                                  │ HTTP / WebSocket
┌─────────────────────────────────▼───────────────────────────────────────┐
│                         APPLICATION LAYER                               │
│   Controllers → Validators → Use Cases / Command Handlers               │
│                                                                           │
│   Command: CompleteSale ──► SaleService.complete()                       │
│                               │                                           │
│                               ▼                                           │
│                    ┌──────────────────────┐                              │
│                    │  Transaction Boundary │  MongoDB Session           │
│                    │  1. Persist aggregate │                              │
│                    │  2. Publish event(s)  │                              │
│                    └──────────┬───────────┘                              │
└───────────────────────────────┼───────────────────────────────────────────┘
                                │
┌───────────────────────────────▼───────────────────────────────────────────┐
│                         DOMAIN LAYER                                      │
│   Aggregates: Order, Purchase, Production, Expense, Shift, Closing      │
│   Domain Events: SaleCompleted, PurchaseReceived, ...                     │
│   Event Bus Interface (port)                                              │
└───────────────────────────────┬───────────────────────────────────────────┘
                                │
┌───────────────────────────────▼───────────────────────────────────────────┐
│                      INFRASTRUCTURE LAYER                                 │
│                                                                           │
│  ┌─────────────────┐    ┌──────────────────────────────────────────┐    │
│  │ Event Store      │    │ In-Process Event Bus (Phase 1-10)         │    │
│  │ business_events  │◄───│ Sync dispatch + async queue (BullMQ)      │    │
│  │ (append-only)    │    │ Future: Redis Streams / NATS if scale     │    │
│  └─────────────────┘    └──────────────────┬───────────────────────┘    │
│                                               │                            │
│         ┌────────────┬────────────┬───────────┼───────────┬──────────┐   │
│         ▼            ▼            ▼           ▼           ▼          ▼   │   │
│    Inventory    Cashflow    Reporting   Dashboard  Notification  AI  │   │
│    Handler      Handler     Handler     Handler    Handler      Feed │   │
│         │            │            │           │           │          │   │
│         ▼            ▼            ▼           ▼           ▼          ▼   │   │
│    Read Models / Projections / Materialized Views                       │   │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Event Catalog

### 3.1 Sales & POS

| Event Type | Trigger | Key Payload |
|------------|---------|-------------|
| `SaleCreated` | Order started at POS | orderId, lines, shiftId |
| `SaleCompleted` | Payment confirmed | orderId, payment, hpp, profit, recipeSnapshot |
| `SaleVoided` | Pre-payment cancel | orderId, reason, approvalId |
| `SaleRefunded` | Post-payment refund | orderId, refundAmount, approvalId |
| `DiscountApplied` | Discount on line/order | orderId, discount, approvalId |

### 3.2 Inventory & Production

| Event Type | Trigger | Key Payload |
|------------|---------|-------------|
| `InventoryReceived` | Purchase receipt / production output | itemId, warehouseId, qty, batch, unitCost |
| `InventoryConsumed` | Sale / production input | itemId, warehouseId, qty, fifoBatches |
| `InventoryAdjusted` | Manual adjustment | itemId, delta, reason, approvalId |
| `InventoryWasted` | Waste recorded | itemId, qty, reason, cost |
| `InventoryExpired` | Expiry write-off | itemId, batchId, qty |
| `ProductionCompleted` | Batch finished | batchId, inputs, output, cost |
| `LowStockDetected` | Threshold crossed | itemId, currentQty, minQty |
| `ExpiryApproaching` | Scheduled check | itemId, batchId, expiryDate |

### 3.3 Purchasing & Finance

| Event Type | Trigger | Key Payload |
|------------|---------|-------------|
| `PurchaseCreated` | PO created | poId, supplierId, lines, approvalId |
| `PurchaseReceived` | Goods received | poId, lines, priceHistoryEntries |
| `PurchasePriceRecorded` | Unit price captured | itemId, supplierId, unitPrice, unit |
| `ExpenseCreated` | Expense recorded | expenseId, category, amount |
| `CashflowRecorded` | Any money movement | type, amount, method, reference |

### 3.4 Operations

| Event Type | Trigger | Key Payload |
|------------|---------|-------------|
| `ShiftOpened` | Cashier/kitchen shift start | shiftId, type, openingCash |
| `ShiftClosed` | Shift end | shiftId, reconciliation |
| `DailyClosingCompleted` | End-of-day close | closingId, totals, variances, pdfUrl |
| `ApprovalRequested` | Action needs approval | requestId, type, payload |
| `ApprovalGranted` | Manager approves | requestId, approverId |
| `ApprovalRejected` | Manager rejects | requestId, reason |

### 3.5 Recipe & Menu

| Event Type | Trigger | Key Payload |
|------------|---------|-------------|
| `RecipeVersionCreated` | New recipe version | recipeId, version, ingredients, hpp |
| `RecipeVersionActivated` | Version set active | recipeId, version |

### 3.6 HR

| Event Type | Trigger | Key Payload |
|------------|---------|-------------|
| `AttendanceRecorded` | Clock in/out | employeeId, type, timestamp |
| `PayrollApproved` | Salary approved | payrollId, approvalId |
| `PayrollPaid` | Salary disbursed | payrollId, amount |

### 3.7 System & Sync

| Event Type | Trigger | Key Payload |
|------------|---------|-------------|
| `SyncBatchUploaded` | Offline POS sync | deviceId, eventCount, lastSequence |
| `SyncConflictDetected` | Conflict during sync | localEvent, serverState |
| `BackupCompleted` | Backup job done | type, location, size |
| `SystemHealthAlert` | Threshold breached | metric, value, severity |

---

## 4. Event Processing Rules

### 4.1 Publish Pattern (Within Transaction)

```typescript
// Pseudocode — Application Layer
async function completeSale(command: CompleteSaleCommand) {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const order = await orderRepo.save(completedOrder, { session });
    const event = BusinessEvent.create({
      eventType: 'SaleCompleted',
      aggregateType: 'Order',
      aggregateId: order.id,
      payload: order.toEventPayload(),
      // ... scoping, actor, correlation
    });
    await eventStore.append(event, { session });  // SAME transaction
    await session.commitTransaction();

    // After commit: dispatch to handlers (async, at-least-once)
    await eventBus.dispatch(event);
  } catch (e) {
    await session.abortTransaction();
    throw e;
  }
}
```

### 4.2 Consumer Idempotency

Every handler records processed `eventId` in `event_consumer_log`:

```
IF eventId already processed → skip (idempotent)
ELSE process → record eventId → commit
```

### 4.3 Handler Responsibilities

| Handler | Subscribes To | Produces |
|---------|---------------|----------|
| **InventoryHandler** | SaleCompleted, ProductionCompleted, PurchaseReceived, Inventory* | Stock updates, FIFO batches |
| **CashflowHandler** | SaleCompleted, PurchaseReceived, ExpenseCreated, PayrollPaid | cashflow_entries |
| **ReportingHandler** | All financial events | Report projection updates |
| **DashboardHandler** | SaleCompleted, ExpenseCreated, LowStockDetected | Dashboard read model |
| **NotificationHandler** | LowStockDetected, ExpiryApproaching, ApprovalRequested, SystemHealthAlert | Notifications |
| **AuditTimelineHandler** | ALL events | audit_timeline entries (human-readable) |
| **PriceHistoryHandler** | PurchaseReceived | purchase_price_history |
| **HppHandler** | RecipeVersionActivated, PurchasePriceRecorded | Recipe HPP recalculation |
| **AIAnalyticsFeed** | ALL events (filtered) | analytics_event_stream export |
| **SyncHandler** | SyncBatchUploaded | Merge/replay offline events |

---

## 5. AI-Ready Architecture

### 5.1 Analytics Event Stream

All `business_events` are exposed to AI/analytics via:

| Interface | Purpose |
|-----------|---------|
| `GET /api/v1/analytics/events` | Paginated event stream (Owner only) |
| `analytics_projections` collection | Pre-aggregated features for ML |
| Webhook export | Push events to external AI pipeline (future) |

### 5.2 AI Use Cases (Future-Ready)

| Use Case | Event Sources |
|----------|---------------|
| Demand forecasting | SaleCompleted (historical by hour/day/menu) |
| Optimal purchase timing | PurchasePriceRecorded, InventoryConsumed |
| Waste prediction | InventoryWasted, InventoryExpired |
| Menu profitability ranking | SaleCompleted (profit per item) |
| Anomaly detection | CashflowRecorded, DailyClosingCompleted variances |
| Staff scheduling | AttendanceRecorded, SaleCompleted volume |

### 5.3 Event Schema Versioning

```json
{
  "eventId": "uuid",
  "eventType": "SaleCompleted",
  "eventSchemaVersion": 1,
  "occurredAt": "2026-07-01T10:30:00Z",
  "businessGroupId": "...",
  "businessId": "...",
  "outletId": "...",
  "warehouseId": "...",
  "actorId": "...",
  "shiftId": "...",
  "correlationId": "...",
  "payload": { }
}
```

New fields added in v2 — consumers handle both versions.

---

## 6. Offline-First Sync via Events

POS devices maintain local event queue when offline:

```
┌──────────────┐         ┌──────────────┐         ┌──────────────┐
│  POS Device  │         │  Sync Agent  │         │   Server     │
│  (IndexedDB) │────────►│  (on reconnect)│───────►│ Event Store  │
│  Local Events│         │  Batch upload │         │ + Merge      │
└──────────────┘         └──────────────┘         └──────────────┘
```

| Rule | Detail |
|------|--------|
| Sync unit | Business events (not raw DB rows) |
| Ordering | `deviceSequence` + server `sequenceNumber` |
| Conflict resolution | Server-wins for stock; manual review for financial conflicts |
| Idempotency | `eventId` deduplication on server |
| Offline capability | SaleCreated, SaleCompleted queued locally |

---

## 7. Audit Timeline vs Business Events

| Collection | Purpose | Audience |
|------------|---------|----------|
| `business_events` | Machine-readable domain events — source of truth for replay | System, AI, sync |
| `audit_timeline` | Human-readable activity feed — "Budi completed sale #142" | Owner, Manager, compliance |

Every business event **also** generates an audit timeline entry via `AuditTimelineHandler`.

---

## 8. Difference from Traditional Audit Log

| Aspect | audit_logs (v1.0) | business_events (v1.1) |
|--------|-------------------|------------------------|
| Purpose | Who changed what | What happened in the business |
| Granularity | CRUD operations | Domain semantics |
| Replay | No | Yes — rebuild projections |
| Offline sync | No | Yes — events are sync packets |
| AI consumption | Requires ETL | Native structured stream |
| Immutability | Yes | Yes |

`audit_logs` retained for HTTP-level security events (login, permission denied).  
`business_events` is the **business truth stream**.

---

## 9. Technology Choices

| Component | Choice | Rationale |
|-----------|--------|-----------|
| Event store | MongoDB `business_events` collection | Same infra; append-only with indexes |
| Event bus (MVP) | In-process EventEmitter + BullMQ queue | Simple; no extra infra |
| Event bus (scale) | Redis Streams | When > 50 outlets or high throughput |
| Offline store | IndexedDB (Dexie.js) on POS | Standard PWA offline pattern |
| Idempotency | `event_consumer_log` collection | At-least-once delivery safe |

---

## 10. Approval

| Item | Status |
|------|--------|
| Business Event DNA principle approved | ☐ |
| Event catalog complete | ☐ |
| Handler mapping approved | ☐ |
| Offline sync via events approved | ☐ |
| AI-ready event stream approved | ☐ |
