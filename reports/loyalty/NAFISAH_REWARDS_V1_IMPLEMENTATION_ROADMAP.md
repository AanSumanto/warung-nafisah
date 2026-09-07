# Nafisah Rewards V1 — Implementation Roadmap

**Document ID:** WN-LOYALTY-ROAD-001  
**Date:** 2026-09-01  
**Status:** PLANNING ONLY

---

## Sprint Sequence Overview

Sequence validated against codebase: event platform exists, Customer/Loyalty greenfield, receipt pipeline frontend-ready, void/refund absent (reversal sprint deferred until void API exists).

```
LOYALTY-01 → LOYALTY-02 → LOYALTY-03 → LOYALTY-04 → LOYALTY-05 → LOYALTY-06 → LOYALTY-07 → LOYALTY-08 → LOYALTY-09
 Foundation   Config       Ledger+Earn   POS Member   Receipt+QR   Portal       Redemption   Void/Reversal Analytics
```

---

## SPRINT LOYALTY-01 — Customer Foundation

### Goal
Create Customer aggregate with phone normalization, masking, and public member token.

### Code areas affected
- `backend/src/domain/loyalty/Customer.ts` (new)
- `backend/src/infrastructure/loyalty/` (new module)
- `backend/src/presentation/routes/v1/loyalty.routes.ts` (new)
- `backend/src/infrastructure/pos/PosModule.ts` — wire LoyaltyModule

### Database impact
- New collection: `customers`
- Indexes: `phoneNormalized` UNIQUE, `publicMemberId` UNIQUE

### API impact
- `POST /api/v1/loyalty/customers` — register (phone, optional name)
- `GET /api/v1/loyalty/customers/search?phone=` — lookup (masked response)
- `GET /api/v1/loyalty/customers/:id` — summary for cashier

### Frontend impact
- None required (API-only sprint acceptable) OR minimal service hooks

### Tests
- Phone normalization: 0812/62812/+62812 → same customer
- Duplicate phone registration blocked
- Masked phone in responses
- publicMemberId entropy length

### Rollback strategy
- Drop `customers` collection if empty; remove routes; no Order changes yet

### Production risk
**Low** — feature not user-visible; `loyalty_program.enabled` not required yet

### Dependencies
None

### Acceptance criteria
- [ ] Customer CRUD with normalized phone
- [ ] Unique phone constraint enforced
- [ ] publicMemberId generated with crypto randomness
- [ ] No startup seed of customers
- [ ] Auth: kasir+owner only

---

## SPRINT LOYALTY-02 — Loyalty Configuration + Reward Catalog

### Goal
Database-driven earn rate and reward catalog; master feature flag.

### Code areas affected
- `backend/src/domain/loyalty/LoyaltyProgram.ts`, `LoyaltyReward.ts`
- Admin routes under owner role

### Database impact
- New: `loyalty_program`, `loyalty_rewards`
- One-time script to insert baseline catalog (NOT startup seed)

### API impact
- `GET /api/v1/loyalty/program` — read config
- `PUT /api/v1/loyalty/program` — owner update (enabled, pointEarnRate)
- `GET /api/v1/loyalty/rewards` — active catalog
- `POST/PATCH /api/v1/loyalty/rewards` — owner manage

### Frontend impact
- Optional owner admin page (can defer UI to sprint 9)

### Tests
- pointEarnRate configurable (5000 default)
- Reward catalog CRUD
- Changing reward config does not affect existing redemption snapshots (no redemptions yet)

### Rollback strategy
- Disable program; collections remain

### Production risk
**Low** — `enabled: false` default

### Dependencies
LOYALTY-01 (optional — can parallel if no FK)

### Acceptance criteria
- [ ] pointEarnRate in DB not env/React
- [ ] 6 baseline rewards insertable via script
- [ ] `loyalty_program.enabled = false` by default

---

## SPRINT LOYALTY-03 — Loyalty Ledger + Earn Engine

### Goal
Append-only ledger, earn calculation, idempotent EARN_SALE.

### Code areas affected
- `backend/src/domain/loyalty/LoyaltyLedgerEntry.ts`
- `backend/src/application/loyalty/LoyaltyEarnService.ts`
- `backend/src/application/loyalty/handlers/LoyaltyEarnReconciliationHandler.ts`
- Register handler in LoyaltyModule → EventRegistry

### Database impact
- New: `loyalty_ledger`
- Unique index: `idempotencyKey`

### API impact
- Internal service only; optional test endpoint behind owner

### Frontend impact
None

### Tests
1. Rp4.999 → 0 points
2. Rp5.000 → 1 point
3. Rp23.000 → 4 points
4. Same order retry → no duplicate (idempotencyKey)
5. Two concurrent awards → one entry (transaction + unique index)
6. Non-member → skip earn
17. Backend restart → no customer/reward mutation

### Rollback strategy
- Disable earn in service; ledger remains for audit

### Production risk
**Medium** — must NOT activate until LOYALTY-04 attaches customer to order

### Dependencies
LOYALTY-01, LOYALTY-02

### Acceptance criteria
- [ ] Ledger types: EARN_SALE minimum
- [ ] balanceAfter on every entry
- [ ] customer.currentPoints updated atomically
- [ ] SaleCompleted handler idempotent via event_consumer_log + ledger key

---

## SPRINT LOYALTY-04 — POS Member Integration

### Goal
Optional member attach in cashier flow; earn on pay; LoyaltyResult in API.

### Code areas affected
- `backend/src/domain/pos/Order.ts` — optional customerId
- `backend/src/infrastructure/pos/documents/OrderDocument.ts`
- `backend/src/application/pos/PosService.ts` — payOrder integration
- `backend/src/presentation/routes/v1/pos.routes.ts` — extend schemas
- `frontend/src/app/(shell)/pos/page.tsx`
- `frontend/src/features/pos/components/PaymentBottomSheet.tsx`
- New: `MemberLookupSheet.tsx`

### Database impact
- Extend `orders`: customerId, customerSnapshot, loyaltySummary

### API impact
- `POST /orders` or new `PUT /orders/:id/member`
- `POST /orders/:id/pay` response includes `loyalty?`

### Frontend impact
- Member chip, phone search, quick register, points display
- Non-member checkout unchanged

### Tests
6. Non-member order works normally
7. Member lookup normalized phone
8. Duplicate phone blocked at register
16. Old orders without member readable

### Rollback strategy
- Set loyalty_program.enabled=false; customerId ignored

### Production risk
**Medium-High** — touches live pay flow; deploy with flag disabled first

### Dependencies
LOYALTY-01, LOYALTY-02, LOYALTY-03

### Acceptance criteria
- [ ] Member optional — pay succeeds without
- [ ] Earn triggered only when enabled + member attached
- [ ] LoyaltyResult returned from payOrder (not calculated in React)
- [ ] SaleCompleted payload includes customerId when present

---

## SPRINT LOYALTY-05 — Receipt Points + QR

### Goal
Display loyalty on receipt; QR to member portal URL.

### Code areas affected
- `frontend/src/features/printing/types/receipt.ts`
- `frontend/src/features/printing/receipt/ReceiptBuilder.ts`
- `frontend/src/features/printing/renderers/EscPosRenderer.ts`
- `frontend/src/features/printing/renderers/PreviewRenderer.ts`
- `frontend/src/features/pos/components/ReceiptPreviewSheet.tsx`

### Database impact
None

### API impact
None (consumes payOrder loyalty field)

### Frontend impact
- Receipt loyalty section + QR/text fallback

### Tests
15. Receipt receives loyalty result without recalculating points
- QR URL format validation
- Fallback text when QR unsupported

### Rollback strategy
- Hide loyalty block when `loyalty` absent

### Production risk
**Low** — additive receipt fields; printing unchanged if no member

### Dependencies
LOYALTY-04

### Acceptance criteria
- [ ] ReceiptBuilder maps LoyaltyResult only
- [ ] EscPosRenderer attempts QR; text fallback
- [ ] No points formula in frontend
- [ ] Non-member receipt identical to today

---

## SPRINT LOYALTY-06 — Public Member Rewards Portal

### Goal
Mobile-first read-only portal via QR token.

### Code areas affected
- `frontend/src/app/rewards/member/[token]/page.tsx` (new route group)
- `backend/src/presentation/routes/v1/public-rewards.routes.ts`
- Rate limit middleware

### Database impact
None new

### API impact
- `GET /api/v1/public/rewards/member/:token` — rate limited, read-only DTO

### Frontend impact
- New public page (no auth shell)

### Tests
9. Public token cannot enumerate customers
10. Portal cannot redeem points directly
- Rate limit triggers 429

### Rollback strategy
- Remove route; QR URL still works when re-enabled

### Production risk
**Medium** — new public surface; mitigated by rate limits + read-only

### Dependencies
LOYALTY-01, LOYALTY-02, LOYALTY-03

### Acceptance criteria
- [ ] Shows points, catalog, activity, next reward
- [ ] CTA "Gunakan Reward di Kasir" — no redeem action
- [ ] No phone/ObjectId in URL or response
- [ ] Invalid token → generic error

---

## SPRINT LOYALTY-07 — Reward Redemption

### Goal
Cashier-confirmed redemption as Rp0 reward line with immutable snapshot.

### Code areas affected
- `backend/src/domain/loyalty/LoyaltyRedemption.ts`
- `backend/src/domain/pos/OrderItem.ts` — lineKind REWARD
- `LoyaltyRedemptionService`
- POS UI redeem flow

### Database impact
- New: `loyalty_redemptions`
- Extend order items

### API impact
- `POST /loyalty/redemptions/reserve`
- `DELETE /loyalty/redemptions/:id/cancel`
- Extend updateOrderItems for reward lines

### Frontend impact
- Eligible rewards list, redeem confirm in payment flow

### Tests
11. Insufficient balance blocks redemption
12. Concurrent redemption no double spend
18. Config change doesn't alter historical redemption snapshot

### Rollback strategy
- Disable reserve endpoint via feature flag

### Production risk
**High** — affects cart totals; thorough staging required

### Dependencies
LOYALTY-04, LOYALTY-03

### Acceptance criteria
- [ ] Reward line at Rp0 with catalog price preserved
- [ ] REDEEM_REWARD ledger entry
- [ ] Earn excludes reward line value from eligible amount

---

## SPRINT LOYALTY-08 — Void/Refund/Reversal

### Goal
Ledger reversals when void/refund APIs exist.

### Code areas affected
- Depends on future `PosService.voidOrder` / `refundOrder`
- `LoyaltyReversalService`

### Database impact
- Ledger entries REVERSAL_VOID, REVERSAL_REFUND

### API impact
- Hook into void/refund routes (must be built first in POS)

### Tests
13. Void creates reversal
14. Refund does not delete original ledger

### Rollback strategy
- Disable reversal handlers

### Production risk
**High** — blocked until POS void/refund exists

### Dependencies
**POS void/refund implementation** (not in codebase today), LOYALTY-03

### Acceptance criteria
- [ ] Original ledger immutable
- [ ] Reversal links to original entry
- [ ] Net balance correct after void

**Note:** Sprint may slip until POS void API delivered; architecture prepared in LOYALTY-03.

---

## SPRINT LOYALTY-09 — Analytics + Operational Controls

### Goal
Owner dashboard for loyalty KPIs; admin UI for config; operational toggles.

### Code areas affected
- Owner dashboard routes
- Optional admin pages for program/rewards
- Fix `applyMenuCatalogPatches` startup mutation

### Database impact
- Query-only on existing collections

### API impact
- `GET /owner/loyalty/dashboard`
- Manual adjustment: `POST /loyalty/adjustments` (owner only)

### Frontend impact
- Owner loyalty analytics tab

### Tests
- Dashboard aggregates match ledger
- Manual adjustment creates MANUAL_ADJUSTMENT entry

### Rollback strategy
- Hide dashboard UI

### Production risk
**Low**

### Dependencies
All prior sprints

### Acceptance criteria
- [ ] Member count, points earned/redeemed, outstanding balance
- [ ] Loyalty cost / eligible omzet ratio
- [ ] Top reward report
- [ ] Menu startup patch removed or gated

---

## Go-Live Phases

| Phase | Sprint(s) | Activity |
|-------|-----------|----------|
| **A — Foundation** | 01–03 | Deploy with `enabled: false`; collections created |
| **B — Internal test** | 04–05 | Staff-only; test earn + receipt |
| **C — Pilot** | 04–06 | Selected members; monitor ledger |
| **D — Full** | 07–09 | Redemption + analytics; enable for all |

---

## Test Strategy (Complete — 18 Cases)

| # | Case | Sprint |
|---|------|--------|
| 1 | Rp4.999 → 0 points | 03 |
| 2 | Rp5.000 → 1 point | 03 |
| 3 | Rp23.000 → 4 points | 03 |
| 4 | Same order retry no double award | 03 |
| 5 | Concurrent award no duplicate | 03 |
| 6 | Non-member order normal | 04 |
| 7 | Normalized phone lookup | 01, 04 |
| 8 | Duplicate phone blocked | 01 |
| 9 | Token cannot enumerate | 06 |
| 10 | Portal cannot redeem | 06 |
| 11 | Insufficient balance blocks redeem | 07 |
| 12 | Concurrent redeem no double spend | 07 |
| 13 | Void creates reversal | 08 |
| 14 | Refund preserves ledger history | 08 |
| 15 | Receipt no recalculation | 05 |
| 16 | Old orders without member readable | 04 |
| 17 | Restart no customer/reward/menu mutation | 01, 02, 09 |
| 18 | Reward config change preserves snapshots | 07 |

---

*End of Implementation Roadmap*
