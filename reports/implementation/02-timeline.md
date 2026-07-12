# Project Timeline

**Project:** Warung Nafisah ERP  
**Document ID:** WN-TIMELINE-001  
**Version:** 1.2.0 (ADR-001)  
**Status:** Revised — ADR-001 Multi-Repository Approved  
**Start Date:** 2026-07-01  
**Estimated MVP:** 2026-11-01 (16 weeks — revised)  
**Estimated Production:** 2027-01-15 (24 weeks)

> Timeline extended from v1.0 to account for event infrastructure, KDS, offline sync, approval workflow, and daily closing.

---

## 1. Timeline Overview (Gantt)

```
2026        Jul     Aug        Sep        Oct        Nov        Dec        Jan'27
            W1-4    W1-4       W1-4       W1-4       W1-4       W1-4       W1-2
Phase 0 v1.1 ████
Phase 1            ████████
Phase 2                    ████████
Phase 3                            ████████
Phase 4                                    ████████████████
Phase 5                                                    ████████
Phase 6                                                            ████
Phase 7                                                                ████
Phase 8                                                                    ████
Phase 9                                                                        ████████
Phase 10                                                                               ████████
```

---

## 2. Revised Schedule Summary

| Phase | Weeks | Duration | Target End |
|-------|-------|----------|------------|
| 0 v1.1 Revision | 1 | 3 days | Jul 4, 2026 |
| 1 — Architecture | 2-3 | 2 weeks | Jul 18, 2026 |
| 2 — Init + Event Core | 4-5 | 2 weeks | Aug 1, 2026 |
| 3 — Foundation | 6-7 | 2 weeks | Aug 15, 2026 |
| 4 — MVP (POS, KDS, Closing) | 8-12 | 5 weeks | Sep 19, 2026 |
| 5 — Supply Chain + Offline | 13-14 | 2 weeks | Oct 3, 2026 |
| 6 — Purchasing | 15 | 1 week | Oct 10, 2026 |
| 7 — Finance | 16-17 | 2 weeks | Oct 24, 2026 |
| 8 — HR | 18-19 | 2 weeks | Nov 7, 2026 |
| 9 — Advanced | 20-22 | 3 weeks | Nov 28, 2026 |
| 10 — Hardening | 23-26 | 4 weeks | Jan 15, 2027 |

---

## 3. Phase 4 Detail (Critical Path — MVP)

| Week | Deliverables |
|------|-------------|
| 8 | Shift management, Approval workflow |
| 9 | Recipe versioning, Unit conversion, Inventory multi-warehouse |
| 10 | Event handlers (Inventory, Cashflow) integration tests |
| 11 | POS + SaleCompleted event chain |
| 12 | KDS WebSocket, Digital receipt (print + QR) |
| 13 | Daily closing + PDF, Dashboard projections, Notification engine core |

**Milestone M4: MVP — Nov 1, 2026** (revised from Oct 1)

---

## 4. Key Milestones (v1.1)

| # | Milestone | Target Date | Criteria |
|---|-----------|-------------|----------|
| M0a | Phase 0 v1.0 approved in principle | Jul 1, 2026 | ✅ Done |
| M0b | Phase 0 v1.1 re-approved | Jul 7, 2026 | Enterprise + event DNA |
| M0c | **ADR-001 Multi-Repo approved** | Jul 1, 2026 | Blueprint revision complete |
| M1 | Architecture approved | Jul 18, 2026 | Event schemas + 64 collections |
| M2 | Event core running | Aug 1, 2026 | Publish → dispatch → idempotent |
| M3 | Foundation complete | Aug 15, 2026 | Hierarchy + auth + audit timeline |
| M4 | **MVP Ready** | Nov 1, 2026 | POS + KDS + events + daily closing |
| M5 | Offline sync working | Oct 3, 2026 | POS offline → sync on reconnect |
| M6 | Full ERP features | Nov 28, 2026 | All P0-P2 modules |
| M7 | **Production Launch** | Jan 15, 2027 | Event replay verified, UAT passed |

---

## 5. Resource Assumptions

| Resource | Assumption |
|----------|------------|
| Developers | 1 full-stack (primary) |
| Timeline impact | Event architecture adds ~4 weeks vs v1.0 |
| With 2 developers | MVP achievable ~12 weeks |

**Conservative production date with buffer: Feb 1, 2027**

---

## 6. New Dependencies (v1.1)

| Dependency | Required By | Owner |
|------------|-------------|-------|
| Redis instance (BullMQ) | Phase 2 | DevOps |
| WhatsApp Business API credentials | Phase 9 | Owner |
| Cloud storage (S3/GCS) for backup | Phase 2 | Owner |
| Kitchen display tablet | Phase 4 UAT | Owner |
| Thermal printer for receipt | Phase 4 UAT | Owner |
| Initial hierarchy setup (business, outlet, warehouses) | Phase 3 | Owner |

---

## 7. Approval

| Version | Approved | Date |
|---------|----------|------|
| v1.0 Timeline | Superseded | |
| v1.1 Timeline | ☐ Pending | |
