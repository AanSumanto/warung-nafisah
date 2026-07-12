# Folder Structure — FINAL (ADR-001 Revised)

**Document ID:** WN-FS-FINAL-001  
**Version:** 2.0.0 (ADR-001)  
**Status:** FROZEN — Supersedes v1.0.0 Monorepo structure  
**Related:** [ADR-001-multi-repository-strategy.md](./ADR-001-multi-repository-strategy.md)

> **Multi-Repository Architecture.** Three separate Git repositories. No monorepo. No shared npm package.

---

## 1. Repository Overview

```
Soemanto / GitHub
├── warung-nafisah-backend/     # Express API + Docker + Workers
├── warung-nafisah-frontend/    # Next.js + MUI → Vercel
└── warung-nafisah-docs/        # All reports/ documentation
```

---

## 2. Backend Repository (`warung-nafisah-backend`)

```
warung-nafisah-backend/
├── src/
│   ├── config/
│   │   ├── env.ts
│   │   ├── database.ts
│   │   ├── redis.ts
│   │   ├── cors.ts
│   │   └── feature-flags.ts
│   │
│   ├── core/                            # ★ Foundation base classes (was @warung-nafisah/core)
│   │   ├── aggregates/
│   │   ├── events/
│   │   ├── exceptions/
│   │   ├── use-cases/
│   │   ├── controllers/
│   │   ├── dto/
│   │   ├── mappers/
│   │   ├── repositories/
│   │   └── providers/                   # Port interfaces
│   │
│   ├── domain/                          # ★ PURE DOMAIN
│   │   ├── aggregates/
│   │   ├── value-objects/
│   │   │   └── Money.ts
│   │   ├── events/
│   │   │   ├── payloads/
│   │   │   └── schemas/                 # JSON Schema per event (was shared/events/schemas)
│   │   ├── services/                    # 17 Domain Services
│   │   └── errors/
│   │       └── DomainError.ts
│   │
│   ├── application/
│   │   ├── commands/
│   │   ├── queries/
│   │   ├── handlers/
│   │   │   ├── commands/
│   │   │   └── queries/
│   │   ├── process-managers/            # Sagas
│   │   ├── ports/                       # Interfaces
│   │   └── dto/
│   │
│   ├── infrastructure/
│   │   ├── database/
│   │   │   ├── mongoose/schemas/
│   │   │   ├── repositories/
│   │   │   └── transactions/
│   │   ├── events/
│   │   │   ├── EventStore.ts
│   │   │   ├── EventBus.ts
│   │   │   ├── EventRegistry.ts
│   │   │   ├── handlers/
│   │   │   ├── projections/
│   │   │   └── queue/
│   │   ├── read-models/
│   │   ├── integrations/                # ★ ALL third-party
│   │   │   ├── midtrans/
│   │   │   ├── xendit/
│   │   │   ├── whatsapp/
│   │   │   ├── email/
│   │   │   ├── printer/
│   │   │   ├── qris/
│   │   │   ├── storage/
│   │   │   ├── firebase/
│   │   │   └── ai/
│   │   ├── backup/
│   │   ├── health/
│   │   ├── pdf/
│   │   ├── sync/
│   │   ├── websocket/
│   │   └── auth/
│   │
│   ├── presentation/
│   │   ├── middleware/
│   │   ├── controllers/
│   │   ├── validators/
│   │   ├── routes/
│   │   │   └── v1/                      # /api/v1/*
│   │   └── websocket/
│   │
│   ├── features/                        # Vertical slices
│   │   ├── hierarchy/
│   │   ├── auth/
│   │   ├── pos/
│   │   ├── kds/
│   │   ├── orders/
│   │   ├── payments/
│   │   ├── inventory/
│   │   ├── recipes/
│   │   ├── production/
│   │   ├── purchasing/
│   │   ├── suppliers/
│   │   ├── expenses/
│   │   ├── shifts/
│   │   ├── daily-closing/
│   │   ├── approvals/
│   │   ├── digital-receipt/
│   │   ├── notifications/
│   │   ├── audit-timeline/
│   │   ├── dashboard/
│   │   ├── reports/
│   │   ├── investor/
│   │   ├── employees/
│   │   ├── attendance/
│   │   ├── salary/
│   │   ├── assets/
│   │   ├── analytics/
│   │   ├── sync/
│   │   ├── health/
│   │   └── settings/
│   │
│   ├── contracts/                       # ★ API contract constants (was shared/constants)
│   │   ├── error-codes.ts
│   │   └── document-prefixes.ts
│   │
│   ├── jobs/                            # BullMQ workers
│   └── app.ts
│
├── openapi/
│   ├── openapi.yaml                     # ★ Canonical API contract
│   └── schemas/                         # Reusable OpenAPI components
│
├── docker/
│   ├── nginx/nginx.conf
│   ├── mongo/init-replica.js
│   ├── redis/redis.conf
│   ├── backup/Dockerfile + backup.sh
│   └── scripts/wait-for-mongo.sh
│
├── tests/
│   ├── unit/domain/
│   ├── unit/application/
│   ├── integration/events/
│   ├── integration/api/
│   ├── contract/
│   ├── performance/
│   └── reconciliation/
│
├── .github/workflows/
├── Dockerfile
├── docker-compose.yml                   # Dev: mongodb, redis, api, worker
├── docker-compose.prod.yml              # Prod: full VPS stack
├── package.json
├── tsconfig.json
└── README.md
```

---

## 3. Frontend Repository (`warung-nafisah-frontend`)

**No Docker. Deploy to Vercel.**

```
warung-nafisah-frontend/
├── src/
│   ├── app/
│   │   ├── (auth)/login/
│   │   ├── (dashboard)/
│   │   │   ├── dashboard/
│   │   │   ├── inventory/
│   │   │   ├── purchasing/
│   │   │   ├── approvals/
│   │   │   ├── daily-closing/
│   │   │   ├── audit-timeline/
│   │   │   ├── reports/
│   │   │   ├── settings/
│   │   │   └── health/
│   │   ├── (pos)/pos/
│   │   ├── (kitchen)/kds/
│   │   ├── (investor)/investor/
│   │   └── receipt/[token]/
│   │
│   ├── features/
│   │   ├── auth/
│   │   ├── pos/
│   │   │   └── offline/                 # IndexedDB event queue
│   │   ├── kds/
│   │   ├── dashboard/
│   │   ├── inventory/
│   │   ├── approvals/
│   │   ├── shifts/
│   │   ├── daily-closing/
│   │   ├── notifications/
│   │   └── ...
│   │
│   ├── shared/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── lib/
│   │   │   └── api-client.ts            # Generated from OpenAPI
│   │   └── theme/
│   │
│   ├── types/
│   │   └── api/                         # Generated DTO types (openapi-typescript)
│   │
│   └── middleware.ts
│
├── public/
├── openapi/                             # Mirror or fetch from backend release
│   └── openapi.yaml                     # Used for codegen in CI
│
├── .github/workflows/                   # Lint, build, Vercel preview
├── package.json
├── tsconfig.json
├── next.config.ts
├── vercel.json                          # Vercel deployment config
└── README.md
```

---

## 4. Docs Repository (`warung-nafisah-docs`)

```
warung-nafisah-docs/
├── reports/
│   ├── architecture/
│   │   ├── ADR-001-multi-repository-strategy.md
│   │   ├── 00-phase0.5-freeze-report.md
│   │   ├── 21-folder-structure-final.md
│   │   └── ...
│   ├── database/
│   ├── api/
│   ├── implementation/
│   ├── verification/
│   ├── testing/
│   ├── performance/
│   ├── security/
│   ├── todo/
│   └── changelog/
├── README.md
└── CONTRIBUTING.md
```

---

## 5. Removed — Monorepo Artifacts (Do Not Create)

| Removed | Replacement |
|---------|-------------|
| Root `package.json` workspaces | Independent repo `package.json` |
| `shared/` npm package | `backend/src/contracts/` + OpenAPI |
| `@warung-nafisah/core` workspace | `backend/src/core/` |
| `@shared/*` import alias | Backend internal aliases only |
| Frontend `Dockerfile` | Vercel native build |
| Root `docker-compose.yml` spanning FE+BE | Backend repo `docker-compose.yml` only |
| `turbo`, `nx`, `lerna` | Not used |
| `apps/`, `packages/` layout | Flat repo roots |

---

## 6. Import Aliases — Backend (Frozen)

| Alias | Path |
|-------|------|
| `@core/*` | `src/core/*` |
| `@domain/*` | `src/domain/*` |
| `@app/*` | `src/application/*` |
| `@infra/*` | `src/infrastructure/*` |
| `@presentation/*` | `src/presentation/*` |
| `@features/*` | `src/features/*` |
| `@contracts/*` | `src/contracts/*` |

## 7. Import Aliases — Frontend (Frozen)

| Alias | Path |
|-------|------|
| `@/*` | `src/*` |
| `@/types/api/*` | `src/types/api/*` (generated) |

---

## 8. Boundary Lint Rules

| Rule | Enforcement |
|------|-------------|
| `domain/` cannot import from `infrastructure/`, `presentation/` | eslint-plugin-boundaries |
| `features/*/controller` cannot import mongoose directly | lint |
| Query handlers cannot import transactional repositories | lint + code review |
| Integrations only in `infrastructure/integrations/` | lint |
| Frontend cannot import backend source | CI — separate repos |
| API types must come from OpenAPI codegen | CI contract test |

---

## 9. Change Control

Changes to this structure require:

1. Architecture Review document or ADR
2. Changelog entry in `warung-nafisah-docs`
3. Stakeholder sign-off

**Status: FROZEN per ADR-001 (2026-07-01).**
