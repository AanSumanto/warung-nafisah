# Risk Analysis

**Project:** Warung Nafisah ERP  
**Document ID:** WN-RISK-001  
**Version:** 1.0.0  
**Status:** Draft — Awaiting Approval

---

## 1. Risk Assessment Matrix

| Probability | Impact: Low (1) | Impact: Medium (2) | Impact: High (3) | Impact: Critical (4) |
|-------------|-----------------|--------------------|--------------------|----------------------|
| **High (3)** | Monitor | Mitigate | Mitigate | **Critical** |
| **Medium (2)** | Accept | Monitor | Mitigate | Mitigate |
| **Low (1)** | Accept | Accept | Monitor | Mitigate |

**Risk Score** = Probability × Impact

---

## 2. Technical Risks

| ID | Risk | Prob | Impact | Score | Mitigation |
|----|------|------|--------|-------|------------|
| TR-001 | MongoDB transaction failures under load causing inconsistent inventory/finance | Medium | Critical | 8 | MongoDB sessions; idempotent event handlers; event_consumer_log; reconciliation job |
| TR-002 | FIFO costing complexity leads to incorrect HPP | Medium | High | 6 | Dedicated FIFO service with unit tests; manual audit sample weekly |
| TR-003 | Single monolith becomes unmaintainable at scale | Low | High | 4 | Clean Architecture from day one; feature modules with clear boundaries |
| TR-004 | JWT token theft on shared tablet | Medium | High | 6 | Short access token TTL; auto-logout on idle; HTTPS only |
| TR-005 | No offline mode — internet outage stops POS | High | Critical | 12 | **v1.1:** Offline-first via IndexedDB event queue; sync on reconnect (Phase 5) |
| TR-006 | MongoDB unindexed queries slow at 100 outlets | Medium | High | 6 | Compound indexes with `outletId`; query review in code review |
| TR-007 | Recipe ingredient unit mismatch (kg vs gram) | Medium | High | 6 | Strict unit enum; conversion table; validation on recipe save |
| TR-008 | Docker deployment misconfiguration | Low | Medium | 2 | Docker Compose with documented env vars; health checks |

---

## 3. Business Risks

| ID | Risk | Prob | Impact | Score | Mitigation |
|----|------|------|--------|-------|------------|
| BR-001 | Staff resistance to new system | High | High | 9 | Tablet-friendly UI; < 30 min training; parallel run period |
| BR-002 | Incomplete initial recipe data delays HPP accuracy | High | High | 9 | Recipe entry as Phase 1 prerequisite; temporary manual HPP override |
| BR-003 | Menu changes frequently — recipe maintenance burden | Medium | Medium | 4 | Easy recipe editor; version history; Manager-only access |
| BR-004 | Investor demands features outside scope | Medium | Medium | 4 | Clear SRS scope; change request process |
| BR-005 | Dual-shift menu complexity confuses POS filtering | Medium | Medium | 4 | Auto-detect shift by time; manual override button |
| BR-006 | Cash reconciliation discrepancies | Medium | High | 6 | End-of-day report; mandatory close-shift workflow |

---

## 4. Security Risks

| ID | Risk | Prob | Impact | Score | Mitigation |
|----|------|------|--------|-------|------------|
| SR-001 | Unauthorized access to financial data | Low | Critical | 4 | RBAC + outlet scope; audit logs; Investor read-only guard |
| SR-002 | Brute force login attacks | Medium | Medium | 4 | Rate limiter; account lockout; strong password policy |
| SR-003 | API abuse / DDoS | Low | High | 3 | Rate limiting; Nginx throttling; Cloudflare (optional) |
| SR-004 | Sensitive data in logs | Medium | Medium | 4 | Log sanitization middleware; no password/token in logs |
| SR-005 | Insider fraud (cashier manipulates sales) | Medium | High | 6 | Audit logs; Manager approval for voids/refunds; daily reconciliation |

---

## 5. Operational Risks

| ID | Risk | Prob | Impact | Score | Mitigation |
|----|------|------|--------|-------|------------|
| OR-001 | Data loss due to no backup | Low | Critical | 4 | Automated daily MongoDB backup; tested restore procedure |
| OR-002 | Single server failure | Medium | High | 6 | Docker restart policy; backup server plan; MongoDB replica set (production) |
| OR-003 | Untrained staff enters wrong data | High | Medium | 6 | Input validation; confirmation dialogs; undo window for non-financial actions |
| OR-004 | Expired ingredients sold due to stock not updated | Medium | High | 6 | Expiry alerts; FIFO auto-consumes oldest batch; waste workflow |

---

## 6. Project Risks

| ID | Risk | Prob | Impact | Score | Mitigation |
|----|------|------|--------|-------|------------|
| PR-001 | Scope creep — building SaaS before internal ERP works | High | High | 9 | Strict phase gates; approval required per phase |
| PR-002 | Over-engineering delays MVP | Medium | High | 6 | P0 requirements first; YAGNI for multi-outlet UI until needed |
| PR-003 | Single developer bottleneck | Medium | Medium | 4 | Modular architecture enables parallel work later |
| PR-004 | Insufficient testing of financial flows | Medium | Critical | 8 | Integration tests + **event replay verification** for every transaction type |

### v1.1 Additional Risks

| ID | Risk | Prob | Impact | Score | Mitigation |
|----|------|------|--------|-------|------------|
| TR-009 | Event handler failure leaves inconsistent projections | Medium | Critical | 8 | event_consumer_log; retry queue; reconciliation scripts; event replay |
| TR-010 | Offline sync conflicts cause duplicate sales | Medium | High | 6 | eventId idempotency; sync_conflicts workflow; Manager review |
| TR-011 | Event schema evolution breaks consumers | Low | High | 3 | eventSchemaVersion; backward-compatible payloads |
| TR-012 | BullMQ/Redis failure stops async handlers | Low | High | 3 | Health monitoring; fallback sync dispatch; Redis persistence |
| BR-007 | Complex hierarchy confuses single-outlet staff | Medium | Medium | 4 | Default single business/outlet/warehouse; hide hierarchy UI until needed |
| PR-005 | Documentation drift from implementation | Medium | Medium | 4 | Update reports at each phase gate; changelog maintained |

---

## 7. Critical Risks (Score ≥ 8)

| ID | Risk | Action Required |
|----|------|-----------------|
| TR-005 | Internet outage stops POS | Document manual fallback for MVP; plan offline mode Phase 4 |
| TR-001 | Transaction inconsistency | Implement atomic MongoDB sessions from Phase 1 |
| PR-004 | Insufficient financial testing | Financial integration test suite mandatory before production |
| BR-001 | Staff resistance | UAT with real cashier before POS go-live |
| BR-002 | Incomplete recipes | Block menu sale without recipe (enforced by system) |
| PR-001 | Scope creep | Phase approval gates (this document set) |

---

## 8. Risk Response Strategy

| Strategy | When to Use |
|----------|-------------|
| **Avoid** | Eliminate risk by changing design (e.g., block sale without recipe) |
| **Mitigate** | Reduce probability or impact (e.g., audit logs, backups) |
| **Transfer** | Insurance, cloud provider SLA |
| **Accept** | Low-score risks with monitoring |

---

## 9. Contingency Plans

### 9.1 Internet Outage (MVP)

1. Switch to manual order slips
2. Record sales in notebook
3. On reconnect: Manager enters batch correction (Phase 4 eliminates this)

### 9.2 Database Corruption

1. Stop application
2. Restore from latest backup
3. Replay audit log for gap period (if needed)
4. Reconcile financial totals

### 9.3 Incorrect HPP Discovery

1. Identify affected date range
2. Recalculate from stock history (batch job)
3. Update report read models
4. Do NOT alter completed order HPP (historical accuracy)

---

## 10. Risk Review Schedule

| When | Action |
|------|--------|
| Each phase gate | Review and update risk register |
| Pre-production | Full security and operational risk review |
| Post go-live (30 days) | Retrospective risk assessment |
| Quarterly | Ongoing risk review |

---

## 11. Approval

| Role | Reviewed | Date |
|------|----------|------|
| Technical Lead | ☐ | |
| Product Owner | ☐ | |
| Business Owner | ☐ | |
