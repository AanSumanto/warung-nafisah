# Enterprise Architecture Requirements (Phase 0 Revision)

**Project:** Warung Nafisah ERP  
**Document ID:** WN-ENT-001  
**Version:** 1.1.0  
**Status:** Draft — Awaiting Approval  
**Revision:** Incorporates 16 enterprise requirements + Business Event DNA

---

## 1. Organizational Hierarchy

### Multi Business → Business → Outlet → Warehouse

```
business_groups (Multi Business / Holding)
    └── businesses (Legal entity / Brand — e.g. "Warung Nafisah")
            └── outlets (Physical location — e.g. "Warung Nafisah Sudirman")
                    └── warehouses (Storage zone — e.g. "Dapur", "Gudang Kering", "Kulkas")
```

| Level | Example | Purpose |
|-------|---------|---------|
| **Business Group** | Soemanto F&B Group | Holding company; cross-business investor view |
| **Business** | Warung Nafisah | Brand / legal entity; menu templates, suppliers |
| **Outlet** | Cabang Sudirman | POS, shifts, daily closing, local staff |
| **Warehouse** | Gudang Dapur | FIFO stock location; transfers between warehouses |

### Scoping Rules

Every operational document carries:

```typescript
{
  businessGroupId: ObjectId,  // always
  businessId: ObjectId,       // always
  outletId: ObjectId,       // always (except group-level config)
  warehouseId: ObjectId,    // inventory operations
}
```

### User Access Scoping

| Role | Scope |
|------|-------|
| Owner | All businesses in group |
| Manager | Assigned outlet(s) |
| Cashier / Kitchen | Assigned outlet + shift |
| Inventory | Assigned outlet + warehouse(s) |
| Investor | Business or group (read-only) |

---

## 2. Recipe Versioning (Immutable History)

| Rule | Detail |
|------|--------|
| Every recipe change creates new version | `recipe_versions` collection |
| Versions are immutable | Never update; only create new |
| Active version pointer | `menu_items.activeRecipeVersionId` |
| Sale locks recipe version | Order line stores `recipeVersionId` + snapshot |
| HPP per version | Calculated at version creation time |
| Event | `RecipeVersionCreated`, `RecipeVersionActivated` |

Past orders always reference the recipe version active at sale time — HPP never retroactively changes.

---

## 3. Purchase Price History

| Rule | Detail |
|------|--------|
| Every purchase receipt records price | `purchase_price_history` per inventory item |
| Fields | itemId, supplierId, unitPrice, unit, qty, purchaseDate, poId |
| Used for | HPP trend analysis, supplier comparison, AI forecasting |
| Event | `PurchasePriceRecorded` on each receipt line |
| Not a replacement for FIFO | FIFO uses batch cost; price history is analytical |

---

## 4. Dynamic Unit Conversion

### Unit System

| Component | Description |
|-----------|-------------|
| `unit_definitions` | Master units: kg, gram, liter, ml, pcs, pack, botol, etc. |
| `unit_conversions` | Conversion rules per inventory item or global |
| Base unit | Each inventory item has one `baseUnit` |
| Conversion | `1 pack = 12 pcs`, `1 kg = 1000 gram` |

### Rules

| Rule | Detail |
|------|--------|
| Recipe ingredients may use different units than inventory base | Auto-convert on consumption |
| Purchase may use supplier unit | Convert to base unit on receipt |
| Conversion at transaction time | Logged in event payload |
| Rounding policy | Configurable per item (floor/ceil/round 4 decimal) |

---

## 5. Kitchen Display System (KDS)

| Feature | Detail |
|---------|--------|
| Dedicated KDS view | Separate route `/kitchen` — large cards, color-coded priority |
| Real-time updates | WebSocket subscription to `SaleCompleted` / order status events |
| Station routing | Items routed to station: grill, fryer, prep (configurable) |
| Bump bar / tap to complete | Kitchen marks item/order ready → `OrderItemReady` event |
| Timer per ticket | Elapsed time since order placed |
| In addition to | Thermal receipt (ESC/POS) for customer counter |

KDS is a **first-class module**, not a subset of POS.

---

## 6. Offline-First POS Synchronization

| Layer | Technology |
|-------|------------|
| Local storage | IndexedDB (Dexie.js) |
| Sync unit | Business events |
| Queue | `pending_events` on device |
| Sync trigger | On reconnect + periodic background sync |
| Conflict policy | See Event-Driven Architecture doc |
| MVP scope | Sales + payments offline; inventory check uses last-synced stock |
| Indicator | UI shows online/offline/syncing status |

See [09-event-driven-architecture.md](./09-event-driven-architecture.md#6-offline-first-sync-via-events).

---

## 7. Notification Engine

### Alert Types

| Category | Triggers |
|----------|----------|
| **Inventory** | Low stock, expiry approaching, expired |
| **Operations** | Gas cylinder low (configurable asset/meter), shift not closed, daily closing overdue |
| **Approvals** | Pending discount, void, refund, purchase, payroll |
| **Kitchen** | New KOT, order waiting > threshold |
| **System** | Backup failed, health alert, sync conflict |

### Delivery Channels

| Channel | Phase |
|---------|-------|
| In-app notification center | P1 |
| Browser push (PWA) | P2 |
| WhatsApp (via API gateway) | P3 |
| Email | P3 |

### Architecture

```
business_events → NotificationHandler → notification_rules (config)
                                      → notification_deliveries (log)
                                      → Channel adapters
```

---

## 8. Daily Closing Module

| Feature | Detail |
|---------|--------|
| Automatic reconciliation | Compare expected (from events) vs actual (manual count input) |
| Per payment method | Cash, QRIS, Transfer variance |
| Per shift aggregation | All shifts in day rolled up |
| PDF generation | Closing report PDF stored and downloadable |
| Event | `DailyClosingCompleted` |
| Lock | After closing, day transactions require Manager override |
| Investor visible | Closing summary on investor dashboard |

---

## 9. Approval Workflow

### Approval-Required Actions

| Action | Default Approver |
|--------|------------------|
| Discount above threshold | Manager |
| Order void | Manager |
| Refund | Manager |
| Purchase order | Manager / Owner (configurable by amount) |
| Payroll disbursement | Owner |
| Stock adjustment (large) | Manager |
| Daily closing variance explanation | Owner (if above threshold) |

### Workflow

```
Request → ApprovalRequested event → Notification to approver
Approver → Approve/Reject → ApprovalGranted/Rejected event
Original action → Proceeds only after ApprovalGranted
```

Collection: `approval_requests` with status: pending, approved, rejected, expired.

---

## 10. Shift Management

| Type | Detail |
|------|--------|
| Cashier shift | Opening cash float, closing reconciliation |
| Kitchen shift | Staff assignment, KDS session |
| Fields | shiftId, type, outletId, openedBy, openedAt, closedAt, openingCash, closingCash |
| POS locked to shift | Sales require active cashier shift |
| Events | `ShiftOpened`, `ShiftClosed` |
| Integration | Daily closing aggregates all shifts |

---

## 11. Digital Receipt

| Channel | Detail |
|---------|--------|
| **Print** | ESC/POS thermal printer |
| **QR Code** | QR links to public receipt view URL |
| **WhatsApp** | Send receipt link via WhatsApp Business API |
| **Email** | Optional email to customer |

Receipt data sourced from `SaleCompleted` event payload.  
Collection: `digital_receipts` with delivery status per channel.

---

## 12. Complete Audit Timeline

| Feature | Detail |
|---------|--------|
| Immutable activity stream | `audit_timeline` collection |
| Human-readable | "Siti (Cashier) completed Sale #WN-001 — Rp 45.000" |
| Filterable | By user, entity, date, outlet, event type |
| Linked to business event | `businessEventId` reference |
| UI | Timeline view with search — Owner/Manager |
| Distinct from | `audit_logs` (security/HTTP), `business_events` (machine replay) |

---

## 13. Automatic Backup Strategy

| Tier | Method | Frequency |
|------|--------|-----------|
| **Local** | `mongodump` to mounted volume | Daily 02:00 |
| **Cloud** | Upload to S3-compatible storage (or GCS) | Daily 03:00 |
| **Retention** | Local 7 days; Cloud 90 days | Configurable |
| **Verification** | Weekly restore test (staging) | Automated script |
| **Event** | `BackupCompleted`, `BackupFailed` |
| **Alert** | Notification on failure |

---

## 14. System Health Monitoring

| Metric | Source |
|--------|--------|
| API response time | Middleware metrics |
| MongoDB connection | Health check |
| Event queue lag | BullMQ queue depth |
| Disk usage | OS metrics |
| Backup status | Last successful backup |
| Sync conflicts | Count last 24h |
| Active POS devices | Heartbeat |

**Dashboard:** `/admin/health` — Owner only  
**Event:** `SystemHealthAlert` when threshold breached

---

## 15. AI-Ready Architecture

| Capability | Implementation |
|------------|----------------|
| Structured event stream | `business_events` with typed payloads |
| Analytics projections | `analytics_projections` — pre-computed aggregates |
| Export API | Event stream pagination for external ML |
| Feature store ready | Event handlers populate projection collections |
| Correlation IDs | Full causal chains for debugging and ML features |

See [09-event-driven-architecture.md](./09-event-driven-architecture.md#5-ai-ready-architecture).

---

## 16. Domain Event / Event-Driven Architecture

**Adopted as core pattern.** All modules communicate via business events internally.

| Publisher | Events | Consumers |
|-----------|--------|-----------|
| POS | SaleCompleted, SaleVoided, SaleRefunded | Inventory, Cashflow, Dashboard, KDS, Notification, AI |
| Purchasing | PurchaseReceived, PurchasePriceRecorded | Inventory, Cashflow, PriceHistory, Notification |
| Production | ProductionCompleted | Inventory, Reporting |
| Expenses | ExpenseCreated | Cashflow, Dashboard, Reporting |
| HR | PayrollPaid | Cashflow, Expense, Notification |
| System | ShiftClosed, DailyClosingCompleted | Reporting, Notification, Dashboard |

**DNA Principle:** Every business action creates a permanent business event.

---

## 17. Requirements Traceability

| # | Enterprise Requirement | Primary Document | ERD Collections |
|---|------------------------|------------------|-----------------|
| 1 | Multi-level hierarchy | This doc §1 | business_groups, businesses, outlets, warehouses |
| 2 | Recipe versioning | This doc §2 | recipe_versions |
| 3 | Purchase price history | This doc §3 | purchase_price_history |
| 4 | Unit conversion | This doc §4 | unit_definitions, unit_conversions |
| 5 | KDS | This doc §5 | (uses orders + events) |
| 6 | Offline sync | EDA doc §6 | sync_devices, sync_conflicts |
| 7 | Notification engine | This doc §7 | notification_rules, notification_deliveries |
| 8 | Daily closing | This doc §8 | daily_closings |
| 9 | Approval workflow | This doc §9 | approval_requests |
| 10 | Shift management | This doc §10 | shifts |
| 11 | Digital receipt | This doc §11 | digital_receipts |
| 12 | Audit timeline | This doc §12 | audit_timeline |
| 13 | Backup | This doc §13 | backup_jobs |
| 14 | Health monitoring | This doc §14 | system_health_metrics |
| 15 | AI-ready | EDA doc §5 | analytics_projections, business_events |
| 16 | Event-driven | EDA doc | business_events, event_consumer_log |

---

## 18. Approval

| Requirement | Approved |
|-------------|----------|
| 1. Organizational hierarchy | ☐ |
| 2. Recipe versioning | ☐ |
| 3. Purchase price history | ☐ |
| 4. Unit conversion | ☐ |
| 5. KDS | ☐ |
| 6. Offline-first sync | ☐ |
| 7. Notification engine | ☐ |
| 8. Daily closing | ☐ |
| 9. Approval workflow | ☐ |
| 10. Shift management | ☐ |
| 11. Digital receipt | ☐ |
| 12. Audit timeline | ☐ |
| 13. Automatic backup | ☐ |
| 14. Health monitoring | ☐ |
| 15. AI-ready | ☐ |
| 16. Event-driven architecture | ☐ |
| Business Event DNA principle | ☐ |
