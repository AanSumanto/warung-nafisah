# Event Naming Convention — Architecture Freeze

**Document ID:** WN-ARCH-018  
**Version:** 1.0.0 (Phase 0.5)  
**Status:** FROZEN

---

## 1. Rules (Mandatory)

| # | Rule | Example |
|---|------|---------|
| 1 | **Past tense** — event already happened | `SaleCompleted` not `CompleteSale` |
| 2 | **PascalCase** — no separators | `OrderCreated` not `order_created` |
| 3 | **Domain language** — business terms | `PurchaseReceived` not `PODone` |
| 4 | **Aggregate noun + verb** | `InventoryAdjusted`, `ShiftOpened` |
| 5 | **No abbreviations** in eventName | `GoodsReceivedNoteCreated` not `GRNCreated` |
| 6 | **Version suffix in metadata only** | `eventVersion: 1` not `SaleCompletedV1` in eventName |
| 7 | **No mixed tense** | Never `SaleComplete` or `CreatingOrder` |

---

## 2. Verb Vocabulary (Approved)

| Verb (Past Tense) | Use For |
|-------------------|---------|
| Created | New entity |
| Updated | Metadata change (non-versioned) |
| Deleted / Retired | Soft removal |
| Completed | Finished process |
| Cancelled | Aborted process |
| Approved / Rejected | Approval workflow |
| Recorded | Ledger/audit entry |
| Detected | System-detected condition |
| Issued | Document output |
| Published | Activated version |
| Received | Inbound goods/payment |
| Consumed | Stock used |
| Adjusted | Manual correction |
| Transferred | Movement between locations |
| Opened / Closed | Shift, drawer, day |
| Started | Process begin (paired with Completed) |
| Sent / Failed | Notification delivery |
| Uploaded / Synced | Offline sync |
| Toggled | Feature flag |
| Assigned | Number or routing assignment |

---

## 3. Anti-Patterns (Forbidden)

| ❌ Wrong | ✅ Correct | Reason |
|----------|-----------|--------|
| `CreateOrder` | `OrderCreated` | Imperative not past tense |
| `sale_completed` | `SaleCompleted` | Wrong case |
| `SALE_COMPLETED` | `SaleCompleted` | Wrong case |
| `OrderCreate` | `OrderCreated` | Wrong tense |
| `SaleCompletedV1` | `SaleCompleted` + eventVersion:1 | Version in metadata |
| `POS_SaleDone` | `SaleCompleted` | Abbreviation + wrong form |
| `Payment` | `PaymentReceived` | Missing verb |

---

## 4. Command vs Event Naming

| Layer | Convention | Example |
|-------|------------|---------|
| Command | Imperative PascalCase | `CompleteSaleCommand` |
| Event | Past tense PascalCase | `SaleCompleted` |
| Handler | Event + Handler | `SaleCompletedInventoryHandler` |
| Projection | Domain + Projection | `SalesProjectionHandler` |

---

## 5. Registry Validation

On event append, `EventNameRegistry.validate(eventName)` must pass.

New events require:
1. Entry in [17-domain-event-catalog.md](./17-domain-event-catalog.md)
2. JSON Schema in `shared/events/schemas/{EventName}.v1.json`
3. Handler subscription declared
