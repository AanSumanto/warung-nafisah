# Transaction Boundaries — Architecture Freeze

**Document ID:** WN-ARCH-022  
**Version:** 1.0.0 (Phase 0.5)  
**Status:** FROZEN

---

## 1. MongoDB Multi-Document Transaction Scope

### MUST be synchronous (single ACID transaction)

| Operation | Collections in Transaction |
|-----------|---------------------------|
| **Append Business Event** | `business_events` + aggregate collection + `outlet_sequences` |
| **Complete Sale** | `orders` + `business_events` (SaleCompleted) + `outlet_sequences` |
| **Receive Purchase** | `purchase_orders` + `business_events` (PurchaseReceived) |
| **Approve Action** | `approval_requests` + `business_events` (ApprovalGranted) + trigger command |
| **Open/Close Shift** | `shifts` + `business_events` |
| **Assign Document Number** | target doc + `document_sequences` + `business_events` |

### Transaction Pattern (Frozen)

```typescript
session.startTransaction();
try {
  await aggregateRepo.save(aggregate, { session });
  await eventStore.append(event, { session });
  await sequenceRepo.increment(outletId, { session });
  await session.commitTransaction();
  await eventBus.dispatchAsync(event);  // AFTER commit only
} catch (e) {
  await session.abortTransaction();
  throw e;
}
```

---

## 2. MUST be asynchronous (eventual consistency)

| Operation | Handler | Consistency |
|-----------|---------|-------------|
| Update projections | Event Handlers | Eventual (< 2s target) |
| Update read models | Event Handlers | Eventual |
| Send notification | NotificationHandler | Eventual |
| Print receipt | ReceiptHandler | Eventual |
| KDS WebSocket push | KitchenHandler | Eventual (< 500ms) |
| AI feature update | AIHandler | Eventual (minutes OK) |
| Analytics aggregation | AnalyticsHandler | Eventual |

---

## 3. NEVER in same transaction

| Combination | Reason |
|-------------|--------|
| `business_events` + `projection_*` | CQRS violation; projection is async |
| `business_events` + `read_*` | Read model is async |
| `business_events` + external API call | External failure would rollback event |
| `orders` + `projection_sales_daily` | Write/read side mixing |

---

## 4. Consistency Model by Module

| Module | Write Consistency | Read Consistency |
|--------|-------------------|------------------|
| POS Sale | Strong (transaction) | Eventual (read models) |
| Inventory FIFO | Strong (in InventoryHandler) | Eventual (snapshot) |
| Dashboard | — | Eventual |
| KDS | — | Eventual + push |
| Daily Closing | Strong (closing transaction) | Strong after DailyClosingCompleted |
| Offline Sync | Eventual (merge on upload) | Local strong + server eventual |

---

## 5. Idempotency Boundaries

| Layer | Key |
|-------|-----|
| Event append | `eventId` (UUID) — reject duplicate |
| Handler processing | `eventId` + `handlerName` in `event_consumer_log` |
| Document number | `outletId` + `docType` + `date` + `sequence` |
| Offline sync batch | `deviceId` + `batchId` |

---

## 6. Failure Matrix

| Failure Point | Primary Event | Recovery |
|---------------|---------------|----------|
| Before commit | None persisted | Return error to client; retry command |
| After commit, before dispatch | Event exists | Reconciliation job dispatches orphaned events |
| Handler fails | Event exists | Retry queue → dead letter → manual replay |
| Projection stale | Event exists | Replay projection from sequence |
| External integration fails | Event exists | Retry integration; never rollback event |

---

## 7. Related

- [19-saga-process-manager.md](./19-saga-process-manager.md)
- [12-event-store-layer.md](./12-event-store-layer.md)
