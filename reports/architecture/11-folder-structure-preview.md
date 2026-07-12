# Folder Structure Preview (Phase 1 Blueprint)

**Project:** Warung Nafisah ERP  
**Document ID:** WN-FS-001  
**Version:** 1.1.0  
**Status:** ⚠️ **SUPERSEDED** by [21-folder-structure-final.md v2.0.0](./21-folder-structure-final.md) and [ADR-001](./ADR-001-multi-repository-strategy.md)

> **Historical document.** This preview described a monorepo layout. ADR-001 (approved 2026-07-01) replaces it with **multi-repository architecture**. Retained for audit trail only.

---

## 1. Monorepo Root (SUPERSEDED)

```
warung-nafisah/
├── backend/
├── frontend/
├── shared/                    # Shared types, event schemas, constants
├── docker/
├── scripts/                   # Backup, restore, seed, migration
├── reports/                   # Documentation (this folder)
├── .github/workflows/         # CI/CD
├── docker-compose.yml
├── docker-compose.prod.yml
└── README.md
```

---

## 2. Backend — Clean Architecture + Events

```
backend/
├── src/
│   ├── config/                # Environment, database, redis, cors
│   ├── shared/                # Cross-cutting utilities
│   │   ├── errors/
│   │   ├── types/
│   │   ├── constants/
│   │   └── utils/
│   │
│   ├── domain/                # PURE — no framework imports
│   │   ├── events/            # ★ Business Event DNA
│   │   │   ├── BusinessEvent.ts
│   │   │   ├── EventTypes.ts
│   │   │   ├── EventCatalog.ts
│   │   │   └── payloads/      # Typed payload per event
│   │   ├── hierarchy/         # BusinessGroup, Business, Outlet, Warehouse
│   │   ├── sales/
│   │   ├── inventory/
│   │   ├── purchasing/
│   │   ├── production/
│   │   ├── recipes/
│   │   ├── finance/
│   │   ├── hr/
│   │   ├── operations/        # Shifts, daily closing, approvals
│   │   └── units/             # Unit conversion domain logic
│   │
│   ├── application/           # Use cases / command handlers
│   │   ├── commands/
│   │   ├── queries/
│   │   ├── handlers/          # Command handlers (orchestration)
│   │   └── ports/             # Interfaces (repositories, event bus)
│   │
│   ├── infrastructure/        # Framework & external implementations
│   │   ├── database/
│   │   │   ├── mongoose/
│   │   │   │   ├── schemas/   # One file per collection
│   │   │   │   └── indexes/
│   │   │   └── repositories/
│   │   ├── events/            # ★ Event Infrastructure
│   │   │   ├── EventStore.ts          # Append to business_events
│   │   │   ├── EventBus.ts            # In-process dispatch
│   │   │   ├── EventConsumerLog.ts    # Idempotency
│   │   │   ├── handlers/              # Event consumers
│   │   │   │   ├── InventoryEventHandler.ts
│   │   │   │   ├── CashflowEventHandler.ts
│   │   │   │   ├── DashboardEventHandler.ts
│   │   │   │   ├── NotificationEventHandler.ts
│   │   │   │   ├── ReportingEventHandler.ts
│   │   │   │   ├── AuditTimelineEventHandler.ts
│   │   │   │   ├── PriceHistoryEventHandler.ts
│   │   │   │   ├── HppEventHandler.ts
│   │   │   │   ├── AnalyticsEventHandler.ts
│   │   │   │   └── SyncEventHandler.ts
│   │   │   └── queue/                 # BullMQ async processing
│   │   ├── sync/              # Offline sync merge logic
│   │   ├── backup/            # Local + cloud backup jobs
│   │   ├── notifications/     # Channel adapters (in-app, WA, email)
│   │   ├── pdf/               # Daily closing PDF generation
│   │   ├── receipt/           # Print, QR, digital receipt
│   │   ├── health/            # System metrics collector
│   │   ├── websocket/         # KDS real-time
│   │   └── auth/              # JWT implementation
│   │
│   ├── presentation/          # HTTP layer
│   │   ├── middleware/
│   │   │   ├── auth.middleware.ts
│   │   │   ├── rbac.middleware.ts
│   │   │   ├── scope.middleware.ts    # business/outlet/warehouse scope
│   │   │   ├── validator.middleware.ts
│   │   │   ├── rateLimiter.middleware.ts
│   │   │   └── audit.middleware.ts
│   │   ├── controllers/       # Thin — delegate to application layer
│   │   ├── validators/        # Joi/Zod schemas per endpoint
│   │   ├── routes/
│   │   └── websocket/         # KDS socket handlers
│   │
│   ├── features/              # ★ Feature modules (vertical slices)
│   │   ├── auth/
│   │   ├── hierarchy/         # Business group, business, outlet, warehouse
│   │   ├── dashboard/
│   │   ├── pos/
│   │   ├── kds/               # Kitchen Display System
│   │   ├── orders/
│   │   ├── payments/
│   │   ├── inventory/
│   │   ├── recipes/
│   │   ├── production/
│   │   ├── purchasing/
│   │   ├── suppliers/
│   │   ├── expenses/
│   │   ├── employees/
│   │   ├── attendance/
│   │   ├── salary/
│   │   ├── assets/
│   │   ├── reports/
│   │   ├── investor/
│   │   ├── notifications/
│   │   ├── approvals/
│   │   ├── shifts/
│   │   ├── daily-closing/
│   │   ├── digital-receipt/
│   │   ├── audit-timeline/
│   │   ├── sync/              # Offline sync API
│   │   ├── health/            # System health dashboard API
│   │   ├── analytics/         # AI-ready event export
│   │   └── settings/
│   │
│   ├── jobs/                  # Scheduled jobs (cron)
│   │   ├── expiry-check.job.ts
│   │   ├── low-stock-check.job.ts
│   │   ├── backup.job.ts
│   │   └── health-check.job.ts
│   │
│   └── app.ts                 # Express bootstrap
│
├── tests/
│   ├── unit/domain/
│   ├── unit/application/
│   ├── integration/events/    # ★ Event handler integration tests
│   ├── integration/api/
│   └── reconciliation/        # Financial consistency scripts
│
├── package.json
└── tsconfig.json
```

---

## 3. Frontend — Feature-Based + Offline

```
frontend/
├── src/
│   ├── app/                   # Next.js App Router
│   │   ├── (auth)/
│   │   │   └── login/
│   │   ├── (dashboard)/
│   │   │   ├── dashboard/
│   │   │   ├── reports/
│   │   │   ├── inventory/
│   │   │   ├── purchasing/
│   │   │   ├── approvals/
│   │   │   ├── daily-closing/
│   │   │   ├── audit-timeline/
│   │   │   ├── health/        # System health (Owner)
│   │   │   └── settings/
│   │   ├── (pos)/
│   │   │   └── pos/           # Tablet POS
│   │   ├── (kitchen)/
│   │   │   └── kds/           # Kitchen Display System
│   │   ├── (investor)/
│   │   │   └── investor/
│   │   └── receipt/
│   │       └── [token]/       # Public digital receipt view
│   │
│   ├── features/              # Feature modules
│   │   ├── auth/
│   │   ├── pos/
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   ├── offline/       # ★ IndexedDB event queue
│   │   │   │   ├── EventQueue.ts
│   │   │   │   ├── SyncManager.ts
│   │   │   │   └── db.ts      # Dexie schema
│   │   │   └── services/
│   │   ├── kds/
│   │   │   ├── components/
│   │   │   └── hooks/useKdsSocket.ts
│   │   ├── dashboard/
│   │   ├── inventory/
│   │   ├── approvals/
│   │   ├── shifts/
│   │   ├── daily-closing/
│   │   ├── notifications/
│   │   ├── audit-timeline/
│   │   └── ...
│   │
│   ├── shared/
│   │   ├── components/        # MUI wrappers, layout, data table
│   │   ├── hooks/
│   │   ├── lib/
│   │   │   ├── api-client.ts
│   │   │   └── query-client.ts
│   │   ├── theme/             # MUI theme, dark mode
│   │   └── types/             # Imported from shared/
│   │
│   └── middleware.ts          # Auth route guard
│
├── public/
├── package.json
└── next.config.ts
```

---

## 4. Shared Package

```
shared/
├── events/                    # ★ Event type definitions (source of truth)
│   ├── EventTypes.ts
│   ├── payloads/
│   │   ├── SaleCompleted.v1.ts
│   │   ├── PurchaseReceived.v1.ts
│   │   └── ...
│   └── index.ts
├── types/
│   ├── hierarchy.ts           # BusinessGroup, Business, Outlet, Warehouse
│   ├── units.ts
│   └── roles.ts
├── constants/
└── package.json
```

---

## 5. Docker & DevOps

```
docker/
├── nginx/
│   ├── nginx.conf
│   └── ssl/
├── mongo/
│   └── init-replica.js
├── backup/
│   ├── Dockerfile
│   └── backup.sh              # mongodump + cloud upload
└── scripts/
    ├── wait-for-mongo.sh
    └── seed-dev.sh
```

---

## 6. Layer Dependency Rules

```
presentation → application → domain
infrastructure → application (via ports)
infrastructure → domain (implements repos, event store)
features → may import from application, presentation, infrastructure

domain → imports NOTHING from outer layers
domain/events → imported by all layers
```

---

## 7. Event Flow Through Folders

```
features/pos/controller
    → application/commands/CompleteSaleHandler
        → domain/sales/Order.complete()
        → infrastructure/events/EventStore.append()
        → infrastructure/events/EventBus.dispatch()
            → infrastructure/events/handlers/InventoryEventHandler
            → infrastructure/events/handlers/CashflowEventHandler
            → infrastructure/events/handlers/DashboardEventHandler
            → ...
```

---

## 8. Phase 1 Deliverable

Phase 1 will finalize this structure with:
- Exact file naming conventions
- Import path aliases (`@domain`, `@app`, `@infra`, `@features`)
- Module boundary lint rules (eslint-plugin-boundaries)
- Event schema JSON Schema definitions
