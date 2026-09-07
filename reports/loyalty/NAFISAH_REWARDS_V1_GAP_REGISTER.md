# Nafisah Rewards V1 — Gap Register

**Document ID:** WN-LOYALTY-GAP-001  
**Date:** 2026-09-01  
**Status:** ACTIVE

---

## Gap Register Format

Each entry includes: finding, evidence, current behavior, risk, recommended architecture, implementation impact, severity.

---

## P0 — Production / Data / Security Blockers

*No P0 blockers identified that prevent beginning foundation sprints.* The POS pay flow is stable; loyalty is fully additive. Monitor SEC-012 if menu patches affect operational catalog during loyalty development.

---

## P1 — Must Solve Before Loyalty Go-Live

### GAP-P1-001 — No Customer domain

| Field | Value |
|-------|-------|
| **Finding** | Zero customer/member/loyalty code in repository |
| **Evidence** | Grep `backend/src`: no Customer, customerId, phoneNormalized |
| **Current behavior** | All sales anonymous |
| **Risk** | Cannot implement rewards without new aggregate |
| **Recommended architecture** | Dedicated `customers` collection per Data Model Proposal |
| **Implementation impact** | LOYALTY-01 |
| **Severity** | **P1** |

---

### GAP-P1-002 — No loyalty ledger

| Field | Value |
|-------|-------|
| **Finding** | Points balance cannot be a single mutable field |
| **Evidence** | No ledger collection; architecture principle requires audit trail |
| **Current behavior** | N/A |
| **Risk** | Financial/operational dispute with no reconciliation |
| **Recommended architecture** | Append-only `loyalty_ledger` with idempotencyKey |
| **Implementation impact** | LOYALTY-03 |
| **Severity** | **P1** |

---

### GAP-P1-003 — No public member token

| Field | Value |
|-------|-------|
| **Finding** | No opaque public identifier for QR portal |
| **Evidence** | Only UUID internal IDs (`Order.ts`, `PosService.ts`) |
| **Current behavior** | N/A |
| **Risk** | QR could expose MongoDB IDs or phone |
| **Recommended architecture** | `publicMemberId` high-entropy on Customer |
| **Implementation impact** | LOYALTY-01, LOYALTY-06 |
| **Severity** | **P1** |

---

### GAP-P1-004 — No backend feature flag for loyalty

| Field | Value |
|-------|-------|
| **Finding** | `loyalty.enabled` documented but not implemented |
| **Evidence** | `reports/security/03-feature-flags.md`; no runtime code |
| **Current behavior** | N/A |
| **Risk** | Partial deploy exposes half-built loyalty |
| **Recommended architecture** | `loyalty_program.enabled` checked server-side |
| **Implementation impact** | LOYALTY-02 |
| **Severity** | **P1** |

---

### GAP-P1-005 — No configuration engine for earn rate / rewards

| Field | Value |
|-------|-------|
| **Finding** | Business rules would need hardcoding without DB config |
| **Evidence** | No `tenant_settings` in code; print config in localStorage only |
| **Current behavior** | Menu prices in MongoDB; no loyalty config |
| **Risk** | Rule changes require code deploy |
| **Recommended architecture** | `loyalty_program` + `loyalty_rewards` collections |
| **Implementation impact** | LOYALTY-02 |
| **Severity** | **P1** |

---

### GAP-P1-006 — customerId not on Order

| Field | Value |
|-------|-------|
| **Finding** | Order aggregate has no member reference |
| **Evidence** | `OrderDocument.ts`, `Order.ts` — no customer fields |
| **Current behavior** | Sales cannot be attributed to members |
| **Risk** | Cannot earn or analyze member sales |
| **Recommended architecture** | Optional `customerId` + snapshot at pay |
| **Implementation impact** | LOYALTY-04 |
| **Severity** | **P1** |

---

### GAP-P1-007 — SaleCompleted payload lacks customerId

| Field | Value |
|-------|-------|
| **Finding** | Event payload omits member identity |
| **Evidence** | `Order.ts:174-187` |
| **Current behavior** | Handlers cannot attribute sale to member |
| **Risk** | Async earn handler missing context |
| **Recommended architecture** | Extend payload when customerId set |
| **Implementation impact** | LOYALTY-04 |
| **Severity** | **P1** |

---

### GAP-P1-008 — No void/refund API for reversal

| Field | Value |
|-------|-------|
| **Finding** | Paid orders cannot be voided/refunded |
| **Evidence** | `Order.cancel()` draft only; no routes |
| **Current behavior** | No reversal path |
| **Risk** | Points remain after void/refund when implemented |
| **Recommended architecture** | LOYALTY-08 reversal ledger; block go-live until void API exists OR manual reversal process |
| **Implementation impact** | LOYALTY-08 + POS void feature |
| **Severity** | **P1** (before full production loyalty) |

---

### GAP-P1-009 — Menu catalog patches on every startup

| Field | Value |
|-------|-------|
| **Finding** | `applyMenuCatalogPatches()` mutates menu on boot |
| **Evidence** | `runDatabaseBootstrap.ts:24`, `seedPosData.ts:204-218` |
| **Current behavior** | MNM003, ADD001 overwritten each restart |
| **Risk** | Violates production master data safety principle |
| **Recommended architecture** | One-time migration; remove from startup |
| **Implementation impact** | LOYALTY-09 or pre-loyalty hotfix |
| **Severity** | **P1** |

---

### GAP-P1-010 — No public API rate limiting

| Field | Value |
|-------|-------|
| **Finding** | Portal will need protection from enumeration |
| **Evidence** | Rate limit only on login (`pos.routes.ts:69`) |
| **Current behavior** | N/A |
| **Risk** | Brute force on member tokens |
| **Recommended architecture** | Rate limit middleware on public rewards routes |
| **Implementation impact** | LOYALTY-06 |
| **Severity** | **P1** |

---

### GAP-P1-011 — Phone normalization utilities absent

| Field | Value |
|-------|-------|
| **Finding** | No shared phone normalize/mask functions |
| **Evidence** | No phone handling in codebase |
| **Current behavior** | N/A |
| **Risk** | Duplicate customers for format variants |
| **Recommended architecture** | `normalizePhoneId()`, `maskPhone()` in domain/common |
| **Implementation impact** | LOYALTY-01 |
| **Severity** | **P1** |

---

## P2 — Important Improvements

### GAP-P2-001 — QR printing not implemented

| Field | Value |
|-------|-------|
| **Finding** | `supportsQr: true` in profile but EscPosRenderer has no QR commands |
| **Evidence** | `printerProfile.ts:27`, `EscPosRenderer.ts` |
| **Current behavior** | Text-only thermal output |
| **Risk** | Receipt QR requires new ESC/POS commands |
| **Recommended architecture** | Native ESC/POS QR + text URL fallback |
| **Implementation impact** | LOYALTY-05 |
| **Severity** | **P2** |

---

### GAP-P2-002 — Receipt interface lacks loyalty fields

| Field | Value |
|-------|-------|
| **Finding** | `Receipt` type has no loyalty block |
| **Evidence** | `frontend/src/features/printing/types/receipt.ts` |
| **Current behavior** | Receipt order-only |
| **Risk** | Ad-hoc loyalty rendering may bypass SSOT |
| **Recommended architecture** | Extend Receipt + ReceiptBuilder |
| **Implementation impact** | LOYALTY-05 |
| **Severity** | **P2** |

---

### GAP-P2-003 — No redemption model

| Field | Value |
|-------|-------|
| **Finding** | No way to add Rp0 reward line with HPP integrity |
| **Evidence** | `OrderItem` has no lineKind/reward metadata |
| **Current behavior** | All lines are menu snapshots at full price |
| **Risk** | Manual discount would break reporting |
| **Recommended architecture** | REWARD lineKind + redemption entity |
| **Implementation impact** | LOYALTY-07 |
| **Severity** | **P2** |

---

### GAP-P2-004 — Audit timeline in-memory only

| Field | Value |
|-------|-------|
| **Finding** | Audit projection not persisted |
| **Evidence** | `AuditTimelineProjection.ts` |
| **Current behavior** | Lost on restart |
| **Risk** | Incomplete operational audit (ledger mitigates for loyalty) |
| **Recommended architecture** | Rely on loyalty_ledger; persist audit later |
| **Implementation impact** | Future platform sprint |
| **Severity** | **P2** |

---

### GAP-P2-005 — RBAC partially implemented

| Field | Value |
|-------|-------|
| **Finding** | Only owner/kasir roles in code vs 12 in frozen matrix |
| **Evidence** | `PosTypes.ts:24` |
| **Current behavior** | Sufficient for V1 MVP |
| **Risk** | Manual adjustment permissions need explicit owner gate |
| **Recommended architecture** | owner-only adjustment in LOYALTY-09 |
| **Implementation impact** | LOYALTY-09 |
| **Severity** | **P2** |

---

### GAP-P2-006 — Abandoned draft orders

| Field | Value |
|-------|-------|
| **Finding** | Draft orders persist with no TTL/cleanup |
| **Evidence** | createDraftOrder saves immediately |
| **Current behavior** | Orphan drafts accumulate |
| **Risk** | Low for loyalty; noise in DB |
| **Recommended architecture** | Draft TTL job (future) |
| **Implementation impact** | Optional |
| **Severity** | **P2** |

---

### GAP-P2-007 — payOrder API idempotency header absent

| Field | Value |
|-------|-------|
| **Finding** | Retry could hit pay twice on different sessions if draft recreated |
| **Evidence** | Frontend creates new draft each checkout |
| **Current behavior** | assertDraft prevents double pay same order |
| **Risk** | Low — same orderId idempotent at domain level |
| **Recommended architecture** | Idempotency-Key header (future) |
| **Implementation impact** | Optional enhancement |
| **Severity** | **P2** |

---

## P3 — Optimization / Future

### GAP-P3-001 — No QR npm library

| Field | Value |
|-------|-------|
| **Finding** | No qrcode dependency (user constraint: no new deps in 28A) |
| **Evidence** | package.json grep |
| **Recommended architecture** | Hand-coded ESC/POS QR; optional dep in LOYALTY-05 with approval |
| **Severity** | **P3** |

---

### GAP-P3-002 — Analytics projections not implemented

| Field | Value |
|-------|-------|
| **Finding** | `projection_customer_spend` in docs only |
| **Evidence** | `reports/database/03-collections-final-registry.md` |
| **Recommended architecture** | Query ledger + orders in V1 |
| **Severity** | **P3** |

---

### GAP-P3-003 — Token rotation infrastructure

| Field | Value |
|-------|-------|
| **Finding** | Single token on customer sufficient for V1 |
| **Recommended architecture** | Separate token table in V2 |
| **Severity** | **P3** |

---

### GAP-P3-004 — Point expiration not designed

| Field | Value |
|-------|-------|
| **Finding** | EXPIRY ledger type reserved; behavior not locked |
| **Recommended architecture** | Schema support without active job |
| **Severity** | **P3** (blocked on business decision) |

---

## BUSINESS_DECISION_REQUIRED

| ID | Topic | Architecture preparation |
|----|-------|------------------------|
| BD-001 | Point expiration period | EXPIRY ledger type; no active job |
| BD-002 | Refund when earned points already redeemed | Reversal logic stub; net balance rules |
| BD-003 | Customer redemption claim UX / optional claim code | Redemption entity supports external reference field |
| BD-004 | Eligible amount rules for bundles/promos | metadata.eligibleAmount breakdown on ledger |
| BD-005 | Whether member register requires name | name optional per blueprint |

---

## Gap Count Summary

| Severity | Count |
|----------|-------|
| P0 | 0 |
| P1 | 11 |
| P2 | 7 |
| P3 | 4 |

---

## Implementation Readiness Statement

**Foundation sprints (LOYALTY-01 through LOYALTY-03) can safely begin** with `loyalty_program.enabled = false` and no changes to existing POS pay behavior.

**Production loyalty activation** requires closing all P1 gaps through LOYALTY-07 minimum, plus void/reversal strategy (GAP-P1-008) before treating loyalty as production-complete.

---

*End of Gap Register*
