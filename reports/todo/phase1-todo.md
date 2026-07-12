# Phase 1 TODO List

**Document ID:** WN-TODO-P1  
**Version:** 1.0.0  
**Status:** Ready after Architecture Freeze sign-off

---

## Phase 1 — Implementation Contracts (No feature code yet)

### Week 1: Schemas & Events

- [ ] Create `shared/events/schemas/` — JSON Schema for all 62 events v1
- [ ] Create `shared/events/registry.ts` — event name + version registry
- [ ] Create `shared/constants/error-codes.ts` — 72 error codes
- [ ] Create `shared/types/money.ts` — Money interface
- [ ] Document all 64 Mongoose schemas (fields + validation)
- [ ] Implement index definitions per [02-index-strategy.md](../database/02-index-strategy.md)

### Week 2: API & OpenAPI

- [ ] OpenAPI 3.0 spec — all `/api/v1/commands/*`
- [ ] OpenAPI 3.0 spec — all `/api/v1/queries/*`
- [ ] Request/response DTO definitions
- [ ] Webhook endpoint specs (Midtrans, Xendit)
- [ ] Sync protocol API spec

### Week 3: Wireframes & UX

- [ ] POS wireframe (tablet landscape)
- [ ] KDS wireframe
- [ ] Dashboard wireframe
- [ ] Daily Closing wizard wireframe
- [ ] Approval inbox wireframe
- [ ] Design system (MUI theme tokens)

### Week 4: Review & Sign-off

- [ ] Architecture review walkthrough
- [ ] Event catalog walkthrough with team
- [ ] RBAC matrix validation with stakeholder
- [ ] Phase 1 sign-off → proceed to Phase 2 (scaffold)

---

## Phase 2 — Scaffold (After Phase 1)

- [ ] Monorepo init per [21-folder-structure-final.md](../architecture/21-folder-structure-final.md)
- [ ] Event Store implementation
- [ ] Event Bus + BullMQ
- [ ] Health endpoints
- [ ] Docker Compose
- [ ] CI pipeline
- [ ] First event replay test

---

## Phase 3+ — Feature Modules

See [01-roadmap.md](../implementation/01-roadmap.md)

---

## Blockers to Resolve Before Phase 1

| # | Item | Owner |
|---|------|-------|
| 1 | Business group name confirmation | Owner |
| 2 | Warehouse names for first outlet | Manager |
| 3 | Cloud storage provider | DevOps |
| 4 | PPN tax applicability | Finance |
| 5 | Discount approval threshold amount | Manager |
