# MongoDB Index Strategy — Architecture Freeze

**Document ID:** WN-DB-002  
**Version:** 1.0.0 (Phase 0.5)  
**Status:** FROZEN

---

## 1. Index Design Principles

| Principle | Rule |
|-----------|------|
| Tenant prefix | Compound indexes lead with `businessGroupId` or `outletId` |
| Event stream | `outletId + sequenceNumber` for ordered replay |
| Idempotency | Unique on `eventId`, `eventId+handlerName` |
| Projections | Unique on projection natural key |
| TTL | Metrics and logs only — never business events |
| Partial | Use for `status: "pending"`, `isActive: true` |

---

## 2. Critical Collections

### `business_events` (Event Store)

| Index | Type | Reason |
|-------|------|--------|
| `{ eventId: 1 }` | **Unique** | Global idempotency |
| `{ outletId: 1, sequenceNumber: -1 }` | Compound | Ordered replay per outlet |
| `{ outletId: 1, eventName: 1, occurredAt: -1 }` | Compound | Filter by type + time |
| `{ aggregateType: 1, aggregateId: 1, occurredAt: -1 }` | Compound | Aggregate history |
| `{ businessGroupId: 1, occurredAt: -1 }` | Compound | Group-level analytics |
| `{ correlationId: 1 }` | Single | Request tracing |

### `event_consumer_log`

| Index | Type | Reason |
|-------|------|--------|
| `{ eventId: 1, handlerName: 1 }` | **Unique** | Handler idempotency |

### `document_sequences`

| Index | Type | Reason |
|-------|------|--------|
| `{ outletId: 1, docType: 1, dateKey: 1 }` | **Unique** | Atomic numbering |

### `outlet_sequences`

| Index | Type | Reason |
|-------|------|--------|
| `{ outletId: 1 }` | **Unique** | Event sequence counter |

---

## 3. Transactional Collections

### `orders`

| Index | Type | Reason |
|-------|------|--------|
| `{ outletId: 1, orderNumber: 1 }` | **Unique** | Doc number |
| `{ outletId: 1, createdAt: -1 }` | Compound | Recent orders |
| `{ outletId: 1, status: 1, createdAt: -1 }` | Compound | Status filter |
| `{ shiftId: 1 }` | Single | Shift reconciliation |

### `stock_batches`

| Index | Type | Reason |
|-------|------|--------|
| `{ outletId: 1, warehouseId: 1, inventoryItemId: 1, receivedAt: 1 }` | Compound | FIFO consumption |
| `{ outletId: 1, expiryDate: 1 }` | Compound | Expiry alerts |
| `{ outletId: 1, warehouseId: 1, inventoryItemId: 1, quantity: 1 }` | Partial `{ quantity: { $gt: 0 } }` | Active batches only |

### `purchase_price_history`

| Index | Type | Reason |
|-------|------|--------|
| `{ inventoryItemId: 1, purchaseDate: -1 }` | Compound | Price trend |
| `{ supplierId: 1, purchaseDate: -1 }` | Compound | Supplier comparison |

---

## 4. Projection Collections

### `projection_sales_daily`

| Index | Type | Reason |
|-------|------|--------|
| `{ outletId: 1, date: 1 }` | **Unique** | One doc per outlet per day |

### `projection_dashboard_outlet_today`

| Index | Type | Reason |
|-------|------|--------|
| `{ outletId: 1 }` | **Unique** | One KPI doc per outlet |

### `projection_kitchen_queue`

| Index | Type | Reason |
|-------|------|--------|
| `{ outletId: 1, status: 1, createdAt: 1 }` | Compound | Active queue |
| `{ orderId: 1 }` | Single | Order lookup |

---

## 5. Read Model Collections

### `read_pos_menu`

| Index | Type | Reason |
|-------|------|--------|
| `{ outletId: 1, shift: 1 }` | **Unique** | Menu per shift |

### `read_audit_timeline`

| Index | Type | Reason |
|-------|------|--------|
| `{ outletId: 1, occurredAt: -1 }` | Compound | Timeline feed |
| `{ actorId: 1, occurredAt: -1 }` | Compound | User activity |
| `{ entityType: 1, entityId: 1 }` | Compound | Entity history |

---

## 6. TTL Indexes

| Collection | TTL Field | Expire After | Reason |
|------------|-----------|--------------|--------|
| `system_health_metrics` | `recordedAt` | 30 days | Metrics rotation |
| `notification_deliveries` (read) | `readAt` | 90 days | Optional cleanup |
| `event_dead_letter` | `createdAt` | 180 days | Ops retention |

> **business_events: NO TTL** — permanent retention (min 7 years financial)

---

## 7. Text Indexes

| Collection | Fields | Reason |
|------------|--------|--------|
| `inventory_items` | `name`, `sku` | Search in inventory UI |
| `menu_items` | `name` | POS search |
| `suppliers` | `name` | Supplier search |
| `audit_timeline` | `summary` | Timeline search |

---

## 8. Hierarchy Collections

| Collection | Index |
|------------|-------|
| `businesses` | `{ businessGroupId: 1, isActive: 1 }` |
| `outlets` | `{ businessId: 1, isActive: 1 }` |
| `warehouses` | `{ outletId: 1, isActive: 1 }` |
| `users` | `{ email: 1 }` unique; `{ outletIds: 1, role: 1 }` |

---

## 9. Sharding Readiness (100+ outlets)

| Shard Key Candidate | Collection |
|---------------------|------------|
| `{ businessGroupId: 1, outletId: 1 }` | `business_events` |
| `{ outletId: 1 }` | `orders`, projections |

---

## 10. Index Review Schedule

| When | Action |
|------|--------|
| Phase 1 | Finalize all indexes in Mongoose schemas |
| Pre-production | `db.collection.aggregate([{$indexStats:{}}])` |
| Monthly post-launch | Slow query log review |

**Total recommended indexes: ~95 across 45 collections**
