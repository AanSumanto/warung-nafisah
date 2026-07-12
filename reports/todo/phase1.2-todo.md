# Phase 1.2 — Foundation Scaffold TODO

**Blocked until Phase 1.1 is approved.**

---

## Prerequisites

- [x] Phase 0.5 Architecture Freeze approved
- [x] Phase 1.1 Repository Foundation complete
- [ ] Phase 1.1 stakeholder approval

---

## Implementation Checklist

### Packages

- [ ] Create `@warung-nafisah/core` package
- [ ] Implement shared package (types, constants, event registry subset)
- [ ] Backend `package.json` with TypeScript, Express, Vitest
- [ ] Frontend `package.json` with Next.js 15, MUI, TanStack Query

### Backend Foundation

- [ ] Environment validation (Zod)
- [ ] Pino logger
- [ ] MongoDB connection (Mongoose)
- [ ] Redis connection (ioredis)
- [ ] BullMQ connection
- [ ] Event Store / Bus / Registry / Dispatcher skeleton
- [ ] Base classes (Aggregate, DomainEvent, Repository, UseCase, Controller)
- [ ] Error handling framework + ResponseWrapper
- [ ] Request context + correlation/request ID middleware
- [ ] Health / readiness / liveness APIs
- [ ] Transaction manager, migration framework, seed framework
- [ ] Provider interfaces (storage, cache, mail, notification)

### Frontend Foundation

- [ ] Next.js app shell (no business pages)
- [ ] MUI theme registry
- [ ] API client base

### DevOps

- [ ] Backend Dockerfile
- [ ] Frontend Dockerfile
- [ ] Enable backend/frontend services in docker-compose.yml
- [ ] CI: build + test jobs with MongoDB/Redis services

### Testing

- [ ] Vitest setup in core, backend
- [ ] Test utilities + mock factory

### Reports

- [ ] `reports/implementation/06-phase1.2-foundation-scaffold.md`
- [ ] `reports/verification/04-phase1.2-verification.md`
- [ ] `reports/testing/05-phase1.2-test-results.md`

---

**Do not start until explicit approval:**  
`Phase 1.1 Approved — Proceed to Phase 1.2`
