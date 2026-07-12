# Development Roadmap

**Project:** Warung Nafisah ERP  
**Document ID:** WN-ROADMAP-001  
**Version:** 1.2.0 (ADR-001)  
**Status:** Revised — ADR-001 Multi-Repository Approved

---

## 1. Roadmap Overview

```
Phase 0 v1.1     Phase 1          Phase 2          Phase 3+
Enterprise       Architecture     Project Init     Module-by-Module
Revision    ──►  & Design    ──►  + Event Core ──►  Event-Driven ERP
[THIS]           [NEXT]           [PENDING]        [PENDING]
```

Each phase requires **written approval** before proceeding.

---

## 2. Phase Definitions

### Phase 0 — Business Analysis & Requirements (v1.1) ✅

**Goal:** Requirements baseline + enterprise architecture revision.

| Deliverable | Status |
|-------------|--------|
| All v1.0 documents | ✅ Complete |
| Event-Driven Architecture | ✅ Complete |
| Enterprise Requirements (16 items) | ✅ Complete |
| ERD v1.1 (38 collections) | ✅ Complete |
| Folder Structure Preview | ✅ Complete |
| Module dependency diagram v1.1 | ✅ Complete |
| Revised roadmap & timeline | ✅ Complete |

**Gate:** Re-approval required before Phase 1.

---

### Phase 1 — System Architecture & Design

**Goal:** Technical blueprint — event-driven clean architecture.

| Deliverable | Description |
|-------------|-------------|
| Clean Architecture diagram | Layers + event flow |
| **Folder structure (final)** | Based on [11-folder-structure-preview.md](../architecture/11-folder-structure-preview.md) |
| **Event catalog (final)** | JSON Schema per event type |
| **Event handler mapping** | Publisher → consumer matrix |
| Database schema (detailed) | 38 Mongoose schemas + all indexes |
| API specification | OpenAPI 3.0 — all endpoints |
| **Hierarchy API design** | Business Group / Business / Outlet / Warehouse |
| Authentication design | JWT + 4-level RBAC scope |
| **Offline sync protocol** | Event upload, conflict resolution spec |
| **Approval workflow design** | State machine diagram |
| Security architecture | Rate limiter, Helmet, CORS |
| UI/UX wireframes | POS, KDS, Dashboard, Daily Closing, Approvals |
| **Backup & health architecture** | Cron jobs, metrics, alerts |

**Reports:** `reports/architecture/`, `reports/database/`, `reports/api/`, `reports/security/`, `reports/uiux/`

**Gate:** Technical review + stakeholder approval.

---

### Phase 2 — Backend Foundation + Frontend Scaffold

**Goal:** Runnable skeleton with event infrastructure in **separate repositories**.

| Deliverable | Repository | Description |
|-------------|------------|-------------|
| Backend repo init | `warung-nafisah-backend` | Express + Clean Architecture |
| Frontend repo init | `warung-nafisah-frontend` | Next.js + MUI + TanStack Query |
| Docs repo | `warung-nafisah-docs` | All `reports/` documentation |
| **OpenAPI spec** | backend | Canonical API contract |
| **Event Store** | backend | `business_events` append-only repository |
| **Event Bus** | backend | In-process dispatch + BullMQ queue |
| **Event handler registry** | backend | Skeleton handlers |
| **event_consumer_log** | backend | Idempotency infrastructure |
| Docker Compose | backend | API + MongoDB + Redis + BullMQ + Nginx |
| **Backup container** | backend | mongodump + cloud upload script |
| **Health endpoints** | backend | `GET /api/v1/health/*` |
| Frontend deploy | Vercel | Auto-deploy on `main` |
| Backend deploy | Bettazon VPS | Docker Compose production |
| CI pipeline | each repo | Independent GitHub Actions |
| Typed DTO | frontend | Generated from OpenAPI — not shared package |

**Gate:** Backend `docker compose up`; event publish → store → dispatch works; Frontend connects via OpenAPI client.

**Gate:** Vercel preview + VPS staging API communicate over `/api/v1`.

---

### Phase 3 — Foundation Modules

**Goal:** Hierarchy, auth, audit timeline, event handlers wired.

| Module | Deliverable |
|--------|-------------|
| **Hierarchy** | Business Group, Business, Outlet, Warehouse CRUD |
| **Authentication** | JWT, 4-level scope, RBAC |
| **Audit Timeline** | Handler projects all events to human-readable feed |
| **Event Handlers** | Skeleton → partial (audit, logging) |
| **Unit Definitions** | Master units + conversion engine |
| **Settings** | Outlet config, approval thresholds |

**Gate:** Login with hierarchy scope; events appear in audit timeline.

---

### Phase 4 — Core Operations (MVP)

**Goal:** Event-driven POS + KDS + inventory + daily operations.

| Module | Priority | Events |
|--------|----------|--------|
| Shift Management | P0 | ShiftOpened, ShiftClosed |
| Approval Workflow | P0 | ApprovalRequested, Granted, Rejected |
| Recipe Versioning | P0 | RecipeVersionCreated, Activated |
| Inventory (multi-warehouse, FIFO) | P0 | InventoryReceived, Consumed |
| Menu Items | P0 | — |
| **POS** | P0 | SaleCreated, SaleCompleted |
| **KDS** | P0 | WebSocket + order status events |
| Orders + Payments | P0 | — |
| **Digital Receipt** | P1 | Print + QR (WhatsApp/Email Phase 5) |
| **Daily Closing** | P0 | DailyClosingCompleted + PDF |
| Cashflow Handler | P0 | Consumes financial events |
| Dashboard Handler | P0 | Event-projected KPIs |
| Reports (daily) | P0 | Event-sourced aggregation |
| **Notification Engine** | P1 | Low stock, approval pending, KOT |

**Gate:** `SaleCompleted` event triggers all handlers atomically; KDS receives orders; daily closing generates PDF.

---

### Phase 5 — Supply Chain & Offline

| Module | Priority | Events |
|--------|----------|--------|
| Production | P1 | ProductionCompleted |
| Inventory advanced | P1 | Waste, expiry, adjustment |
| **Offline Sync** | P1 | SyncBatchUploaded, SyncConflictDetected |
| **Purchase Price History** | P1 | PurchasePriceRecorded |
| **Analytics / AI Feed** | P2 | analytics_projections populated |
| Assets + gas monitoring | P2 | Low gas → notification |

**Gate:** POS works offline; events sync on reconnect; production converts stock.

---

### Phase 6 — Purchasing & Supplier

| Module | Priority | Events |
|--------|----------|--------|
| Supplier master | P1 | — |
| Purchasing + approval | P1 | PurchaseCreated, PurchaseReceived |
| Price history handler | P1 | Auto on receipt |

**Gate:** Purchase with approval → inventory + cashflow + price history via events.

---

### Phase 7 — Finance & Reconciliation

| Module | Priority |
|--------|----------|
| Expenses | P1 |
| Refund workflow (with approval) | P1 |
| Financial reports (weekly, monthly) | P1 |
| Shift variance reports | P1 |

**Gate:** Profit = revenue − HPP − expenses; verified against event stream.

---

### Phase 8 — HR Module

| Module | Priority | Events |
|--------|----------|--------|
| Employees | P2 | — |
| Attendance | P2 | AttendanceRecorded |
| Salary + approval | P2 | PayrollApproved, PayrollPaid |

**Gate:** Payroll with Owner approval → expense + cashflow events.

---

### Phase 9 — Advanced & Investor

| Module | Priority |
|--------|----------|
| Investor Dashboard | P3 |
| Digital Receipt (WhatsApp, Email) | P2 |
| Notification (push, WhatsApp) | P2 |
| Report export PDF/CSV | P2 |
| Advanced analytics projections | P2 |

**Gate:** Investor read-only; event stream export for AI.

---

### Phase 10 — Production Hardening

| Deliverable | Description |
|-------------|-------------|
| Event replay testing | Rebuild projections from event stream |
| Reconciliation scripts | Ledger vs event stream consistency |
| Security audit | OWASP + pen test |
| Load testing | 3 POS + KDS + event throughput |
| Backup restore test | Weekly automated verification |
| Offline sync stress test | Conflict scenarios |
| UAT | Cashier + kitchen + manager |
| Event schema migration test | Version upgrade path |

**Gate:** UAT passed; event replay produces identical dashboard; production deployed.

---

### Phase 11 — Multi-Business & SaaS (Future)

| Feature | Priority |
|---------|----------|
| Multi-business management UI | P4 |
| Cross-business reporting | P4 |
| Mixed payment | P4 |
| Delivery integration | P4 |
| Redis Streams event bus (scale) | P4 |
| Customer loyalty | P4 |

---

## 3. Module Implementation Order (v1.1)

```
 1. Event Engine (store, bus, consumer log)
 2. Hierarchy (business group → business → outlet → warehouse)
 3. Authentication (4-level scope)
 4. Audit Timeline handler
 5. Unit Conversion engine
 6. Settings
 7. Shift Management
 8. Approval Workflow
 9. Recipe Versioning
10. Inventory (multi-warehouse FIFO)
11. Event Handlers: Inventory, Cashflow (wired)
12. POS + Offline queue
13. KDS (WebSocket)
14. Orders + Payments
15. Digital Receipt (print + QR)
16. Daily Closing + PDF
17. Dashboard + Reports handlers
18. Notification Engine
19. Production
20. Offline Sync agent
21. Purchase Price History
22. Analytics / AI projections
23. Purchasing + Supplier
24. Expenses + Refund
25. HR (employees, attendance, salary)
26. Investor Dashboard
27. System Health dashboard
28. Backup automation (production config)
```

---

## 4. Architecture Evolution

| Stage | Scale | Architecture |
|-------|-------|--------------|
| MVP | 1 outlet | Modular monolith + in-process event bus |
| Growth | 1-10 outlets | MongoDB replica set + Redis (BullMQ) |
| Scale | 10-100 outlets | Read replicas + event projection optimization |
| Enterprise | 100+ outlets / multi-business | Redis Streams or NATS; shard by businessGroupId |
| AI | Any | analytics_projections + event export API |

---

## 5. Decision Log (v1.1)

| # | Decision | Rationale | Revisit When |
|---|----------|-----------|--------------|
| D1 | Monolith + internal event-driven | Team size, operational simplicity | > 50 outlets high throughput |
| D2 | business_events as DNA | Audit, AI, sync, replay — one primitive | Never |
| D3 | In-process event bus (MVP) | No extra infra; BullMQ for async | Event lag > 1s sustained |
| D4 | 4-level hierarchy | Multi-business from day one | Never |
| D5 | Immutable recipe_versions | HPP integrity | Never |
| D6 | FIFO per warehouse | Multi-storage locations | Never |
| D7 | KDS via WebSocket | Real-time kitchen; not polling | Never |
| D8 | Offline sync via events | Idempotent, ordered, replayable | Never |
| D9 | Unified approval_requests | One workflow engine | Never |
| D10 | audit_timeline + business_events | Machine + human readable | Never |
| D11 | MongoDB event store | Same infra; proven append-only pattern | > 1M events/day |
| D12 | Indonesian UI | User-facing language | International expansion |
| D13 | **Multi-repository** (ADR-001) | Aligns with Soemanto Vercel + VPS standard | Never revert to monorepo |
| D14 | **OpenAPI contract** | Decouple FE/BE without shared npm package | Never use cross-repo source sharing |

---

## 6. Success Criteria Per Phase

| Phase | Success Criteria |
|-------|-----------------|
| 0 v1.1 | Enterprise requirements + event DNA approved |
| 1 | Event schemas, 38 collection schemas, API spec approved |
| 2 | Event publish → store → dispatch → idempotent consume works |
| 3 | Hierarchy + auth + audit timeline operational |
| 4 | SaleCompleted → all handlers; KDS live; daily closing PDF |
| 5 | Offline sync works; production events correct |
| 6 | Purchase events → inventory + price history |
| 7 | Financial reports match event stream replay |
| 8 | Payroll approval → expense event |
| 9 | Investor read-only; analytics export works |
| 10 | Event replay = identical state; UAT passed |

---

## 7. Approval

| Phase | Approved By | Date |
|-------|-------------|------|
| Phase 0 v1.0 | ☑ In principle | |
| Phase 0 v1.1 | ☐ Pending re-approval | |
| Phase 1 | ☐ Pending | |
