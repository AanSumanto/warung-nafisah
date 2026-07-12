# Warung Nafisah ERP — Documentation

**Repository:** `warung-nafisah-docs` (per ADR-001)  
**Status:** ✅ **Sprint 4.5.1 POS Mobile Experience (v0.10.1)** — Awaiting Approval

---

## ★ Architectural DNA

> **"Every business action creates a permanent business event."**

---

## Phase Status

| Phase | Name | Status |
|-------|------|--------|
| 0 / 0.5 | Requirements + Architecture Freeze | ✅ Approved |
| ADR-001 | Multi-Repository Strategy | ✅ Approved |
| Sprint 1 | Backend Foundation (+ Redis Hotfix v0.5.1) | ✅ Approved |
| Sprint 2 | Core Domain Framework (v0.6.0) | ✅ Approved |
| Sprint 3A | Frontend Foundation (v0.7.0) | ✅ Approved |
| **Sprint 3B** | **Persistence Framework (v0.8.0)** | **✅ Approved** |
| **Sprint 4** | **Business Event Platform (v0.9.0)** | **✅ Approved** |
| **Sprint 4.5** | **Operational POS MVP (v0.10.0)** | **✅ Approved** |
| **Sprint 4.5.1** | **POS Mobile Experience (v0.10.1)** | **✅ Complete — Awaiting Approval** |
| Sprint 5+ | Inventory & modules | ⬜ Blocked |

---

## Sprint 4.5.1 Reports

| Document | Purpose |
|----------|---------|
| [Implementation](./sprint4.5.1/implementation-report.md) | Mobile UX deliverables |
| [Mobile POS Guideline](./ui/mobile-pos-guideline.md) | Wireframe, flows, PWA roadmap |
| [Verification](./sprint4.5.1/verification-report.md) | Compliance |
| [Testing](./sprint4.5.1/testing-report.md) | Build results |
| [Checklist](./sprint4.5.1/todo.md) | Completion gate |

## Sprint 4.5 Reports

| Document | Purpose |
|----------|---------|
| [Implementation](./sprint4.5/implementation-report.md) | POS MVP deliverables |
| [Business Doc](./business/operational-pos-mvp.md) | Flow, wireframe, API, upgrade path |
| [Verification](./sprint4.5/verification-report.md) | Compliance |
| [Test Results](./sprint4.5/testing-report.md) | 84/84 Vitest |
| [Checklist](./sprint4.5/todo.md) | Completion gate |

## Sprint 4 Reports

| Document | Purpose |
|----------|---------|
| [Business Event Platform](./implementation/14-sprint4-business-event-platform.md) | Sprint 4 implementation |
| [ADR-003](./architecture/ADR-003-business-event-platform.md) | Architecture decision record |
| [Event Platform Architecture](./architecture/business-event-platform.md) | Flow diagrams |
| [Verification](./verification/10-sprint4-verification.md) | Compliance |
| [Test Results](./testing/11-sprint4-test-results.md) | 77/77 Vitest |
| [Checklist](./todo/sprint4-todo.md) | Completion gate |

## Sprint 3B Reports

| Document | Purpose |
|----------|---------|
| [Persistence Framework](./implementation/13-sprint3b-persistence-framework.md) | Sprint 3B implementation |
| [Persistence Architecture](./database/persistence-framework.md) | Flow diagrams |
| [Verification](./verification/09-sprint3b-persistence-verification.md) | Compliance |
| [Test Results](./testing/10-sprint3b-persistence-test-results.md) | 69/69 Vitest |
| [Checklist](./todo/sprint3b-todo.md) | Completion gate |

## Sprint 3A Reports

| Document | Purpose |
|----------|---------|
| [Implementation](./sprint3a/implementation-report.md) | Sprint 3A deliverables |
| [Verification](./sprint3a/verification-report.md) | Compliance check |
| [Testing](./sprint3a/testing-report.md) | Build + unit tests |
| [TODO](./sprint3a/todo.md) | Completion checklist |

## Sprint 1 Hotfix Reports (v0.5.1)

| Document | Purpose |
|----------|---------|
| [Redis Hotfix](./implementation/11-sprint1-redis-hotfix.md) | Root cause + fix |
| [Hotfix Verification](./verification/07-sprint1-redis-hotfix-verification.md) | Compatibility matrix |
| [Hotfix Test Results](./testing/08-sprint1-redis-hotfix-test-results.md) | 51/51 Vitest |
| [Re-Approval Checklist](./todo/sprint1-reapproval-checklist.md) | Gate criteria |

## Sprint 2 Reports

| Document | Purpose |
|----------|---------|
| [Core Domain Framework](./implementation/10-sprint2-core-domain-framework.md) | Sprint 2 implementation |
| [Verification](./verification/06-sprint2-core-verification.md) | Compliance check |
| [Test Results](./testing/07-sprint2-core-test-results.md) | 56/56 Vitest |
| [Sprint 2 Checklist](./todo/sprint2-todo.md) | Completion gate |
| [Sprint 3 TODO](./todo/sprint3-todo.md) | Next steps (blocked) |

## Sprint 1 Reports

| Document | Purpose |
|----------|---------|
| [Backend Foundation](./implementation/09-sprint1-backend-foundation.md) | Sprint 1 implementation |
| [Verification](./verification/05-sprint1-backend-verification.md) | Build & compliance |
| [Test Results](./testing/06-sprint1-backend-test-results.md) | 6/6 Vitest (superseded by hotfix 51/51) |
| [Sprint 2 TODO](./todo/sprint2-todo.md) | Next steps |

## ADR-001 Reports

| Document | Purpose |
|----------|---------|
| [ADR-001](./architecture/ADR-001-multi-repository-strategy.md) | **Decision record — read first** |
| [Blueprint Revision](./implementation/08-adr-001-blueprint-revision.md) | What changed |
| [Architecture Audit](./verification/04-adr-001-audit.md) | Monorepo reference audit |
| [Documentation Audit](./testing/05-adr-001-documentation-audit.md) | Consistency check |
| [Post-ADR TODO](./todo/post-adr-001-todo.md) | Next steps |

---

## Repository Map (ADR-001)

| Repository | Purpose | Deployment |
|------------|---------|------------|
| `warung-nafisah-backend` | Express API, events, workers | Docker → Bettazon VPS |
| `warung-nafisah-frontend` | Next.js + MUI | Vercel |
| `warung-nafisah-docs` | This documentation | GitHub |

**Shared contract:** OpenAPI + REST `/api/v1` — not shared source code.

---

## Architecture Docs (Frozen)

| Document | ID |
|----------|-----|
| [Freeze Report](./architecture/00-phase0.5-freeze-report.md) | WN-FREEZE-001 |
| [ADR-001 Multi-Repo](./architecture/ADR-001-multi-repository-strategy.md) | WN-ADR-001 |
| [Folder Structure v2.0.0](./architecture/21-folder-structure-final.md) | WN-FS-FINAL |
| [Deployment Architecture](./architecture/23-deployment-architecture.md) | WN-DEPLOY-001 |
| [Development Setup](./implementation/06-development-setup.md) | WN-DEV-001 |
| [CI/CD Strategy](./implementation/07-cicd-strategy.md) | WN-CICD-001 |
| [Roadmap v1.2.0](./implementation/01-roadmap.md) | WN-ROADMAP-001 |
| [Timeline v1.2.0](./implementation/02-timeline.md) | WN-TIMELINE-001 |

---

## Report Index

```
reports/
├── architecture/     # ADR, event system, folder structure, deployment
├── database/         # ERD, indexes, collections
├── api/              # Versioning, error codes, OpenAPI strategy
├── security/         # RBAC, flags, tenant settings
├── implementation/   # Roadmap, CI/CD, dev setup
├── testing/          # Test strategy, audits
├── performance/      # SLA targets
├── verification/     # Freeze checklist, audits
├── changelog/
└── todo/
```

---

## Approval

Reply: **"ADR-001 Approved — Proceed to Repository Initialization"**
