# Phase 0 v1.1 — Checklist & Re-Approval Tracker

**Project:** Warung Nafisah ERP  
**Last Updated:** 2026-07-01  
**Revision:** 1.1.0 — Enterprise Architecture

---

## Phase 0 v1.1 Deliverables

| # | Document | Path | Status |
|---|----------|------|--------|
| 1 | Phase 0 Index (v1.1) | `reports/architecture/00-phase0-index.md` | ✅ Done |
| 2 | Business Analysis | `reports/architecture/01-business-analysis.md` | ⚠️ v1.0 (see enterprise doc) |
| 3 | SRS | `reports/architecture/02-software-requirements-specification.md` | ⚠️ v1.0 (see enterprise doc) |
| 4 | Functional Requirements | `reports/architecture/03-functional-requirements.md` | ⚠️ v1.0 (see enterprise doc) |
| 5 | Non-Functional Requirements | `reports/architecture/04-non-functional-requirements.md` | ⚠️ v1.0 (see enterprise doc) |
| 6 | Risk Analysis | `reports/architecture/05-risk-analysis.md` | ⚠️ v1.0 |
| 7 | Use Cases | `reports/architecture/06-use-cases.md` | ⚠️ v1.0 |
| 8 | Business Flowcharts | `reports/architecture/08-business-flowcharts.md` | ⚠️ v1.0 |
| 9 | **Event-Driven Architecture** | `reports/architecture/09-event-driven-architecture.md` | ✅ New |
| 10 | **Enterprise Requirements** | `reports/architecture/10-enterprise-requirements.md` | ✅ New |
| 11 | **Folder Structure Preview** | `reports/architecture/11-folder-structure-preview.md` | ✅ New |
| 12 | ERD v1.1 (38 collections) | `reports/database/01-entity-relationship-diagram.md` | ✅ Updated |
| 13 | Module Overview v1.1 | `reports/modules/00-module-overview.md` | ✅ Updated |
| 14 | Roadmap v1.1 | `reports/implementation/01-roadmap.md` | ✅ Updated |
| 15 | Timeline v1.1 | `reports/implementation/02-timeline.md` | ✅ Updated |

> Phase 1 will merge enterprise requirements into SRS, FR, NFR, use cases, and flowcharts as formal v1.1 revisions.

---

## ★ Business Event DNA — Approval

| Principle | Approved |
|-----------|----------|
| Every business action creates permanent `business_events` record | ☐ |
| Downstream effects via event handlers (not inline) | ☐ |
| Events are sync unit for offline POS | ☐ |
| Events feed AI/analytics natively | ☐ |
| audit_timeline projects from events (human-readable) | ☐ |

---

## Enterprise Requirements Approval

| # | Requirement | Approved |
|---|-------------|----------|
| 1 | Multi Business → Business → Outlet → Warehouse | ☐ |
| 2 | Recipe versioning (immutable) | ☐ |
| 3 | Purchase price history | ☐ |
| 4 | Dynamic unit conversion | ☐ |
| 5 | Kitchen Display System (KDS) | ☐ |
| 6 | Offline-first synchronization | ☐ |
| 7 | Notification engine | ☐ |
| 8 | Daily closing + PDF | ☐ |
| 9 | Approval workflow | ☐ |
| 10 | Shift management | ☐ |
| 11 | Digital receipt (print, QR, WA, email) | ☐ |
| 12 | Complete audit timeline | ☐ |
| 13 | Automatic backup (local + cloud) | ☐ |
| 14 | System health monitoring | ☐ |
| 15 | AI-ready architecture | ☐ |
| 16 | Domain event / event-driven architecture | ☐ |

---

## Architecture Artifacts Approval

| Artifact | Approved |
|----------|----------|
| ERD v1.1 — 38 collections | ☐ |
| Event catalog (30+ event types) | ☐ |
| Event handler mapping | ☐ |
| Folder structure preview | ☐ |
| Module dependency diagram v1.1 | ☐ |
| Roadmap v1.1 (26 weeks) | ☐ |
| Timeline v1.1 (MVP Nov 2026) | ☐ |

---

## Open Questions (Updated)

| # | Question | Answer | Date |
|---|----------|--------|------|
| 1 | PPN/tax applicable? | _Pending_ | |
| 2 | Discount approval threshold? | _Pending_ | |
| 3 | Gendum: batch or per-order? | _Pending_ | |
| 4 | Business group name for Warung Nafisah? | _Pending_ | |
| 5 | Warehouse list per outlet (e.g. dapur, kulkas)? | _Pending_ | |
| 6 | WhatsApp Business API available? | _Pending_ | |
| 7 | Cloud backup provider preference (S3/GCS/DO)? | _Pending_ | |
| 8 | Number of POS + KDS devices at launch? | _Pending_ | |

---

## Phase Approval Gates

| Phase | Status | Approved By | Date |
|-------|--------|-------------|------|
| Phase 0 v1.0 | ☑ In principle | Stakeholder | Jul 2026 |
| **Phase 0 v1.1** | **🟡 Awaiting Re-Approval** | | |
| Phase 1 | ⬜ Not Started | | |

---

## Next Actions (After v1.1 Approval)

1. Answer open questions
2. Phase 1: Finalize event JSON schemas
3. Phase 1: Complete Mongoose schemas for 38 collections
4. Phase 1: OpenAPI specification
5. Phase 1: Wireframes for POS, KDS, Daily Closing, Approvals
