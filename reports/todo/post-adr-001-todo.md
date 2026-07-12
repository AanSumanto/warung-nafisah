# Post ADR-001 — Implementation TODO

**Blocked until ADR-001 blueprint revision is approved.**

---

## Prerequisites

- [x] Phase 0.5 Architecture Freeze
- [x] ADR-001 blueprint revision complete
- [ ] ADR-001 stakeholder approval

---

## Repository Initialization (No Business Code)

### warung-nafisah-docs

- [ ] Create Git repository `warung-nafisah-docs`
- [ ] Move `reports/` content to docs repo root
- [ ] Add README, CONTRIBUTING
- [ ] CI: markdown link validation

### warung-nafisah-backend

- [ ] Create Git repository `warung-nafisah-backend`
- [ ] Scaffold folder structure per `21-folder-structure-final.md` v2.0.0
- [ ] Root tooling: ESLint, Prettier, Husky, TypeScript
- [ ] `docker-compose.yml` (MongoDB, Redis)
- [ ] `Dockerfile` + `docker-compose.prod.yml`
- [ ] CI: lint, test, docker build
- [ ] VPS deploy pipeline (Bettazon)
- [ ] Placeholder `openapi/openapi.yaml`

### warung-nafisah-frontend

- [ ] Create Git repository `warung-nafisah-frontend`
- [ ] Scaffold folder structure per v2.0.0
- [ ] Root tooling: ESLint, Prettier, TypeScript, Next.js
- [ ] **No Dockerfile**
- [ ] Connect Vercel project
- [ ] CI: lint, typecheck, build
- [ ] `openapi-typescript` codegen script
- [ ] `vercel.json`

---

## Phase 1.2 — Foundation Scaffold (After Repo Init)

- [ ] Backend: Express, health APIs, env validation, Pino
- [ ] Backend: MongoDB, Redis, BullMQ connections
- [ ] Backend: Event Store/Bus skeleton, base classes in `src/core/`
- [ ] Backend: OpenAPI spec for health endpoints
- [ ] Frontend: Next.js shell, MUI theme, API client from OpenAPI
- [ ] Contract test: frontend codegen matches backend spec

---

## Abandoned (Per ADR-001)

- ~~Monorepo `warung-nafisah` with npm workspaces~~
- ~~`shared/` npm package~~
- ~~`@warung-nafisah/core` workspace package~~
- ~~Frontend Dockerfile~~
- ~~Root docker-compose spanning FE+BE~~

---

**Approve with:** `ADR-001 Approved — Proceed to Repository Initialization`
