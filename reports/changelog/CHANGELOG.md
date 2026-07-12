# Changelog

All notable changes to the Warung Nafisah ERP project documentation.

---

## [Unreleased]

### Planned

- ADR-001 multi-repo migration
- Sprint 5+: Inventory (blocked until Sprint 4.5.2 revision approval)

---

## [0.11.4-hotfix2] — 2026-07-12 — RawBT WRC Error Fix

### Fixed

- RawBT intent URI: `intent:base64,<data>` (was incorrect `intent:rawbt:base64,<data>`)
- Base64 URL-encoding for intent special characters
- ESC/POS text encoding: Latin-1 single-byte (not UTF-8)
- Enhanced `[RawBT]` dispatch logging

### Docs

- `reports/printing/wrc-error-rca.md`

---

### Fixed

- Integration tests failed after login rate limit (max 10) blocked `beforeEach` logins
- Skip login rate limit in `NODE_ENV=test`; production unchanged
- `loginAndGetToken()` helper with explicit API contract assertions

### Docs

- `reports/testing/14-login-rate-limit-rca.md`

---

## [0.11.4] — 2026-07-12 — Sprint 4.5.2 Revision Thermal Printing

### Fixed

- Removed `window.print()` path — printing no longer captures browser UI
- All print output via ESC/POS → RawBT → Blueprint BP-ECO58

### Added

- `PreviewRenderer` / `EscPosRenderer` separation
- `PrinterProfile` (Blueprint BP-ECO58)
- `printReceipt()` / `reprintReceipt()` API
- `reports/printing/thermal-printing-revision.md`

### Removed

- `BrowserPrintAdapter`, `HtmlReceiptRenderer`, browser print config

---

## [0.11.3] — 2026-07-12 — Sprint 4.5.3 RawBT Bluetooth Printing Bridge

### Added

- `RawBtPrinterAdapter` for Blueprint BP-ECO58 via RawBT (Android intent + ESC/POS base64)
- Printer config UI on `/profil`, readiness chip, RawBT install dialog
- Snackbar print feedback; reprint flow uses `PrintService.reprint()`
- `reports/printing/rawbt-bridge.md`

### Not Included

- Web Bluetooth SPP, native Android bridge, kitchen printer, print queue worker

---

## [0.10.1] — 2026-07-11 — Sprint 4.5.1 POS Mobile Experience

### Added

- Mobile-first POS UX: bottom navigation, cart/payment bottom sheets, numeric pad
- Favorite menus, menu cards, floating cart, skeleton loading, empty states
- Pages: `/shift`, `/profil`
- PWA manifest structure, Indonesian UI copy
- `reports/ui/mobile-pos-guideline.md`

---

## [0.10.0] — 2026-07-11 — Sprint 4.5 Operational POS MVP

### Added

- Operational POS MVP (backend + frontend)
- JWT auth (Owner / Kasir), master menu seed, order lifecycle Draft → Paid
- Human-readable order numbers, dining type, payment methods (Cash/QRIS/Transfer)
- MongoDB transaction on pay + SaleCompleted event via outbox
- Shift management, owner dashboard, HTML thermal receipt
- 7 POS integration tests (84 total Vitest)
- `reports/business/operational-pos-mvp.md`

### Not Included

- Inventory, Recipe, Purchase, Finance, payment gateway

---

## [0.9.0] — 2026-07-11 — Sprint 4 Business Event Platform

### Added

- Business Event Platform (`backend/src/domain/events/`, `core/events/`, `application/events/`, `infrastructure/events/`)
- Domain: `BaseDomainEvent`, `BusinessEvent`, `EventMetadata`, `EventEnvelope`, `EventVersion`
- Application: `EventPublisher`, `InProcessEventDispatcher`, `EventRegistry`, `EventSerializer`/`EventDeserializer`, `ProjectionRegistry`, `AuditTimelineProjection`
- Infrastructure: `MongoEventStore`, `MongoOutboxRepository`, `MongoInboxRepository`, `MongoEventConsumerLog`, `MongoDeadLetterQueue`, `MongoFailedEventLog`, `EventPersistence`, `OutboxDispatcher`
- Outbox + Inbox patterns with MongoDB transaction support
- Retry policy, dead letter queue, failed event log, handler idempotency
- 8 new integration tests (77 total Vitest)
- ADR-003 + business event platform architecture report

### Changed

- `MongoTransactionManager` — session cleanup no longer triggers rollback after successful commit

### Not Included

- Business handlers (POS, Inventory, Finance, Dashboard, etc.)
- RabbitMQ / Kafka / Redis Streams
- Authentication module

---

## [0.8.0] — 2026-07-11 — Sprint 3B Persistence Framework

### Added

- MongoDB persistence framework (`src/infrastructure/`)
- Database: Connection, Session, Transaction, Index, Health managers
- MongoRepository, MongoReadRepository, MongoWriteRepository (generic)
- MongoMapper, MongoSpecificationEvaluator, MongoPageResult
- MongoUnitOfWork implementing IUnitOfWork
- Base documents: Timestamp, Audit, SoftDelete, Versioned
- Query builders: filter, sort, projection, offset + cursor pagination
- Transaction retry policy with exponential backoff
- 13 new tests (69 total) with mongodb-memory-server

### Not Included

- Business repositories, Event Store, Event Bus, Auth

---

## [0.7.0-maintenance] — 2026-07-11 — Project Structure Cleanup

### Removed

- `shared/` monorepo workspace (unused placeholder per ADR-001)
- Stale `docker/` artifacts (broken Dockerfiles, nginx, backup, scripts)
- Root `docker-compose.yml` and `docker-compose.prod.yml`
- Duplicate `backend/scripts/scaffold-folders.mjs`

### Added

- `deployment/` — local MongoDB + Redis infrastructure
- `reports/maintenance/cleanup-report.md`

### Changed

- Root `package.json` — 2 workspaces; real build/test scripts
- CI builds and tests backend + frontend
- Makefile, README, `.env.example` aligned with ADR-001 ports

---

## [0.7.0] — 2026-07-11 — Sprint 3A Frontend Foundation

### Added

- Next.js 15 App Router frontend (`frontend/`)
- React 19, Material UI 6, TanStack Query, Axios, React Hook Form, Zod, Notistack
- Theme system (palette, typography, breakpoints)
- Global providers: Theme, Query, Snackbar, Auth (placeholder), Permission (placeholder)
- Axios API client with request/response interceptors
- App Shell with empty Sidebar + Topbar
- Route group `(shell)` — `/` shows empty shell
- Reusable components: AppButton, AppCard, AppTable, AppDialog, AppForm
- Loading, ErrorBoundary, error.tsx, global-error.tsx
- Environment validation (Zod)
- Sprint 3A reports

### Not Included

- Login, Dashboard, POS, Inventory, Kitchen, Finance, CRM, business modules

---

## [0.5.1] — 2026-07-11 — Sprint 1 Redis Hotfix

### Fixed

- **NOAUTH on startup** — BullMQ used `{ url: REDIS_URL }` which bypassed authentication; now uses explicit host/port/username/password from parsed URL
- **Reconnect log spam** — removed misleading per-reconnect success logs; throttled runtime reconnect warnings (30s)
- **Split Redis env vars** — consolidated to single `REDIS_URL` only

### Added

- `redis-url.ts` — URL parser, credential masking, TLS auto-detection from `rediss://`, provider detection
- Fail-fast startup with exponential backoff (5 attempts)
- `RedisConnectionError` with safe diagnostic fields (no password)
- `getBullMqConnectionOptions()` for BullMQ-compatible auth
- 18 new unit tests (51 total)
- Hotfix reports: implementation, verification, testing, re-approval checklist

### Changed

- Health `/health` includes Redis protocol, TLS, provider, masked URL
- MongoDB startup logs aligned (`✓` / `✗` format)

### Security

- Redis passwords never appear in logs

---

## [0.6.0] — 2026-07-11 — Sprint 2 Core Domain Framework

### Added

- Domain framework: Entity (`BaseEntity`), AggregateRoot, ValueObject, Identifier, Result, Either, BusinessRule, Money, DateTime
- Domain errors: DomainError, DomainException
- DomainEvent interface (`IDomainEvent`) — no Event Store/Bus
- Application: BaseUseCase, CQRS interfaces (ICommand/IQuery + handlers), BaseDTO, BaseMapper
- Pagination, Cursor Pagination, Filter, Sort
- Core persistence interfaces: IRepository, IUnitOfWork, ITransaction, ISpecification
- Shared: ApiResponse, PageResult, Metadata, common types, generic utilities
- Sprint 2 naming aliases (`Entity`, `IRepository`, `DomainEvent`, `ApiResponse`, `PageResult`, `Metadata`)
- 32 domain unit tests + Either tests (56 total with Sprint 1 regression)

### Not Included

- Event Store, Event Bus, MongoDB repository implementations, business modules

---

## [0.5.0] — 2026-07-01 — Sprint 1 Backend Foundation

### Added

- Express API bootstrap with TypeScript (port 5000)
- Zod environment validation
- Pino logger + pino-http request logging
- MongoDB connection (Mongoose) — host database
- Redis Cloud connection (ioredis + TLS support)
- BullMQ placeholder queue preparation
- Request context, correlation ID, request ID middleware
- ResponseWrapper + BaseException error framework
- Health endpoints: `/api/v1/health/live`, `/ready`, `/health`
- Graceful shutdown (SIGTERM/SIGINT)
- ESLint, Prettier, Vitest (6 tests)
- Backend folder structure skeleton
- Sprint 1 reports

### Infrastructure

- Native Node.js only — no Docker/docker-compose (per sprint rules)
- MongoDB: existing host database
- Redis: Redis Cloud

### Not Included

- Auth, User, POS, Inventory, Event Store, Event Bus, business modules

---

## [0.2.0] — 2026-07-01 — ADR-001 Multi-Repository Strategy

### Added

- **ADR-001** — Multi-repository architecture (backend, frontend, docs)
- Deployment architecture: Vercel (frontend) + Docker VPS (backend)
- Development setup guide (multi-repo)
- CI/CD strategy (per-repository pipelines)
- OpenAPI as shared contract between frontend and backend

### Changed

- Folder Structure FINAL v2.0.0 — supersedes monorepo v1.0.0
- Roadmap v1.2.0, Timeline v1.2.0
- NFR deployment requirements (NFR-DEPLOY-001..009)
- API versioning v1.1.0 — OpenAPI contract section
- Testing strategy — contract tests via OpenAPI
- SRS deployment diagram — Vercel + VPS
- Freeze report — ADR-001 amendment

### Superseded

- Monorepo npm workspaces
- `shared/` cross-repo npm package
- Phase 1.1 monorepo repository foundation
- Frontend Docker deployment

### Unchanged

- Event DNA, CQRS, 62 events, 64 collections, domain/security contracts

---

## [0.1.1] — 2026-07-01 — Phase 1.1 Repository Foundation (SUPERSEDED by ADR-001)

### Added

- Monorepo workspace shell: `shared`, `backend`, `frontend` (placeholders only)
- Frozen folder structure (WN-FS-FINAL-001) with `scripts/scaffold-folders.mjs` + `scripts/verify-structure.mjs`
- Root developer tooling: ESLint flat config, Prettier, Husky, lint-staged, Commitlint
- `README.md`, `CONTRIBUTING.md`, `Makefile`, `.env.example`, `.nvmrc`, `.gitattributes`
- Docker Compose skeleton (MongoDB + Redis only)
- `docker-compose.prod.yml` skeleton
- Docker infra configs: mongo init, redis conf, nginx skeleton, backup skeleton
- GitHub Actions CI skeleton (structure, format, lint, compose validation)
- VS Code settings and extension recommendations
- Phase 1.1 implementation, verification, and test reports
- Phase 1.2 TODO checklist

### Changed

- Removed premature Phase 1 application code to align with phased delivery
- Workspaces contain no application runtime dependencies

### Not Included (by design)

- Express, Next.js, MongoDB/Redis application connections, Event Bus, APIs
- Business modules, authentication, POS, inventory

---

## [0.4.0] — 2026-07-01 — Phase 1 Foundation Scaffold (superseded by 1.1 phased approach)

### Added

- Monorepo with npm workspaces: `core`, `shared`, `backend`, `frontend`
- **@warung-nafisah/core** — BaseAggregate, BaseDomainEvent, BaseProjection, BaseRepository, BaseUseCase, BaseController, BaseDTO, BaseMapper, ResponseWrapper, BaseException, provider ports, event interfaces
- **@warung-nafisah/shared** — constants, error codes, foundation event registry
- **Backend** — Express app, Zod env validation, Pino logger, MongoDB/Redis/BullMQ, Event Store/Bus/Registry/Dispatcher, Transaction Manager, migration/seed framework, health APIs, provider mocks
- **Frontend** — Next.js 15, MUI, TanStack Query, foundation landing page
- Docker Compose (MongoDB, Redis, backend, frontend, nginx)
- Husky, lint-staged, commitlint, EditorConfig, Prettier
- GitHub Actions CI workflow
- Vitest tests (7 total)
- Phase 1 implementation and verification reports

### Not Included (by design)

- Authentication, POS, Inventory, Dashboard, business schemas

---

## [0.3.0] — 2026-07-01 — Architecture Freeze (Phase 0.5)

### Added
- **Phase 0.5 Architecture Freeze** — full system contract documentation
- Event Store layer separation (Commands, Domain, Event Store, Bus, Handlers, Projections, Read Models)
- Event metadata standard (18 fields)
- Event versioning strategy (eventName + eventVersion)
- Projection strategy (8 domains, 11+ projection collections)
- Read Model strategy — dashboard forbidden from transactional reads
- Domain Event Catalog — **62 events** across 16 modules
- Event naming convention (past tense PascalCase)
- Saga / Process Manager with retry and compensation
- 17 Domain Services catalog
- Money Value Object specification
- Universal Document Number Service (15 prefixes)
- API versioning `/api/v1` with CQRS commands/queries split
- Error code catalog — **72 codes**
- RBAC matrix — **12 roles**
- Feature flags — 19 per tenant
- `tenant_settings` schema
- Integration layer — 9 third-party adapters
- MongoDB index strategy — ~95 indexes
- Collections final registry — **64 collections**
- Folder structure **FINAL**
- Transaction boundaries document
- Testing strategy (9 test types)
- Seed strategy (master, demo, test)
- Performance SLA targets
- Architecture freeze checklist
- Phase 1 TODO list
- Phase 0.5 freeze report

### Changed
- Collections: 38 → 64 (added projections, read models, saga, sequences)
- Events: informal ~30 → formal 62
- Roles: 6 → 12
- API pattern: REST → CQRS commands/queries

### Frozen (No Change Without ARB Review)
- Folder structure
- Event metadata envelope
- Business Event DNA principle
- CQRS read/write separation
- Money Value Object in domain
- Document number format

---

## [0.2.0] — 2026-07-01 — Enterprise Revision (Phase 0 v1.1)

- Business Event DNA, 16 enterprise requirements, 38 collections, event-driven architecture

---

## [0.1.0] — 2026-07-01 — Initial Phase 0

- Business analysis, SRS, requirements, ERD v1.0, roadmap

---

[Unreleased]: compare/v0.3.0...HEAD
[0.3.0]: releases/tag/v0.3.0
[0.2.0]: releases/tag/v0.2.0
[0.1.0]: releases/tag/v0.1.0
