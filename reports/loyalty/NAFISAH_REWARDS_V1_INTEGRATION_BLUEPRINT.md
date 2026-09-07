# Nafisah Rewards V1 — Integration Blueprint

**Document ID:** WN-LOYALTY-INT-001  
**Date:** 2026-09-01  
**Status:** PLANNING ONLY

---

## 1. Purpose

Define how Nafisah Rewards V1 integrates into the existing Warung Nafisah ERP **without modifying POS business logic, receipt printing behavior, or production env vars** during foundation phases.

---

## 2. Integration Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        CASHIER (POS)                            │
│  Menu → [Optional Member] → Cart → Pay → Receipt + QR           │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                     POST /orders/:id/pay                        │
│  PosService.payOrder()                                          │
│    ├─ Order.pay() → status=paid, SaleCompleted event            │
│    ├─ PaymentWriter → payments                                 │
│    ├─ [NEW] LoyaltyEarnService (if member + enabled)           │
│    │     └─ loyalty_ledger EARN_SALE (idempotent)               │
│    └─ eventPublisher → outbox (same Mongo session)              │
└────────────────────────────┬────────────────────────────────────┘
                             │ commit
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│              OutboxDispatcher → SaleCompleted                   │
│    ├─ [NEW] LoyaltyEarnReconciliationHandler (idempotent)       │
│    └─ AuditTimelineProjection (existing)                        │
└────────────────────────────┬────────────────────────────────────┘
                             │
         ┌───────────────────┴───────────────────┐
         ▼                                       ▼
┌─────────────────┐                   ┌─────────────────────────┐
│ payOrder API    │                   │ Public Member Portal    │
│ returns Order + │                   │ GET /rewards/member/:   │
│ LoyaltyResult   │                   │ token (read-only)       │
└────────┬────────┘                   └─────────────────────────┘
         ▼
┌─────────────────┐
│ ReceiptBuilder  │  ← consumes LoyaltyResult, no calculation
│ + QR on receipt │
└─────────────────┘
```

---

## 3. Authoritative Integration Points

### 3.1 Point earning trigger

| Attribute | Value |
|-----------|-------|
| **Primary trigger** | `PosService.payOrder()` — synchronous loyalty write inside Mongo transaction |
| **Secondary trigger** | `SaleCompleted` event handler — idempotent reconciliation |
| **Business moment** | `Order.pay()` when status becomes `'paid'` |
| **NOT valid triggers** | Frontend callback, payment collection watch, dashboard polling |

**Evidence:** `backend/src/domain/pos/Order.ts:139`, `backend/src/application/pos/PosService.ts:220`

### 3.2 Source of truth hierarchy

| Data | Source of truth |
|------|-----------------|
| Sale completed | `orders.status === 'paid'` + `SaleCompleted` in `business_events` |
| Points balance (operational) | `loyalty_ledger` (sum); `customer.currentPoints` is cache |
| Reward catalog (active) | `loyalty_rewards` collection |
| Earn rate | `loyalty_program.pointEarnRate` (default 5000) |
| Redemption fact | `loyalty_redemptions` + `REDEEM_REWARD` ledger entry |
| Public member identity | `customers.publicMemberId` (high-entropy token) |

---

## 4. Customer / Member Integration

### 4.1 Phone normalization

Single utility `normalizePhoneId(input: string): string`:

| Input | Normalized |
|-------|------------|
| `081234567890` | `6281234567890` |
| `6281234567890` | `6281234567890` |
| `+6281234567890` | `6281234567890` |

Display: `maskPhone('6281234567890')` → `08******890`

### 4.2 Member attachment to order

**Recommended:** Optional field on draft order.

```
POST /orders
{ diningType, customerId?: string }

OR

PUT /orders/:id/member
{ phone?: string, customerId?: string, registerName?: string }
```

Persist on `Order`:
- `customerId?: string`
- `customerSnapshot?: { phoneMasked, name? }` — set at pay time

Include in `SaleCompleted` payload when present.

### 4.3 Non-member path

No `customerId` → skip loyalty earn; POS unchanged.

---

## 5. Point Earning Engine

### 5.1 Formula (backend only)

```typescript
eligibleAmount = order.total - sum(rewardLineCatalogValues)  // future
pointsEarned = Math.floor(eligibleAmount / pointEarnRate)    // pointEarnRate from DB
```

Examples: Rp4.999 → 0; Rp5.000 → 1; Rp23.000 → 4.

### 5.2 Eligible amount V1

**V1 simplification:** `eligibleAmount = order.total` when no redemption lines; exclude lines with `lineKind: 'REWARD'`.

**BUSINESS_DECISION_REQUIRED:** Whether bundles/promos affect eligible amount.

### 5.3 Idempotency

**Unique business key:** `(customerId, orderId, ledgerType='EARN_SALE')`

Implementation:
- Unique compound index on `loyalty_ledger`
- Handler checks `event_consumer_log` for `eventId + handlerName`
- Pay endpoint rejects duplicate earn via index conflict → return existing result

### 5.4 API response extension

```typescript
// POST /orders/:id/pay response
{
  ...order,
  loyalty?: {
    pointsEarned: number;
    currentPoints: number;
    nextReward?: { name: string; pointsRequired: number; pointsRemaining: number };
    memberPortalUrl: string;
    phoneMasked?: string;
  }
}
```

Frontend passes `loyalty` to `ReceiptBuilder.build(order, config, loyaltyResult)`.

---

## 6. Loyalty Ledger Integration

### 6.1 Ledger entry on earn

```typescript
{
  customerId,
  orderId,
  orderNumber,
  type: 'EARN_SALE',
  pointsDelta: +N,
  balanceAfter,
  reason: 'Pembelian {orderNumber}',
  actor: { type: 'system', userId: cashierId },
  metadata: {
    eligibleAmount,
    pointEarnRate,
    programVersion,
  },
  createdAt
}
```

### 6.2 Event emission

After ledger write, emit `LoyaltyPointsEarned` via outbox (same transaction when possible).

Frozen catalog reference: `reports/architecture/17-domain-event-catalog.md` — CRM section.

### 6.3 Reconciliation handler

`LoyaltyEarnReconciliationHandler` on `SaleCompleted`:
- If no `customerId` in payload → skip
- If ledger entry exists → skip
- Else create entry (repair path for missed sync writes)

---

## 7. Receipt / QR Integration

### 7.1 Data flow (no recalculation)

```
payOrder response.loyalty
  → ReceiptBuilder.build(order, config, loyalty)
  → Receipt.loyalty { pointsEarned, currentPoints, memberPortalUrl, ... }
  → EscPosRenderer: QR(memberPortalUrl) + text lines
  → PreviewRenderer: optional QR image for screen
```

### 7.2 QR content

URL only — **never** phone, MongoDB `_id`, or sequential ID.

Example: `https://{app-domain}/rewards/member/{publicMemberId}`

### 7.3 ESC/POS implementation plan

Extend `EscPosRenderer` with optional QR segment when `receipt.loyalty?.memberPortalUrl` present:

1. Try native ESC/POS QR (Model 2)
2. Fallback: centered text URL (32 chars/line on BP-ECO58)

**No change to RawBT bridge** — same byte payload path.

---

## 8. Redemption Integration

### 8.1 Recommended model

**Dual entity:** `loyalty_redemptions` + special order line.

| Entity | Role |
|--------|------|
| `loyalty_redemptions` | Business record with immutable reward snapshot |
| Order line `lineKind: 'REWARD'` | POS/cart representation at Rp0 customer cost |

Order line fields (extended):
```typescript
lineKind: 'MENU' | 'REWARD';
rewardRedemptionId?: string;
catalogPrice: number;      // normal menu price (HPP reporting)
customerPaid: 0;
pointsSpent: number;
rewardSnapshot: { rewardId, name, pointsCost, menuKode, hppEstimate };
```

### 8.2 Redemption flow

```
1. GET /loyalty/customers/:id/eligible-rewards  (cashier)
2. POST /loyalty/redemptions/reserve { customerId, rewardId, orderId? }
3. PUT /orders/:id/items — include reward line
4. POST /orders/:id/pay
   → REDEEM_REWARD ledger (-points)
   → finalize redemption status=COMPLETED
   → EARN_SALE on remaining eligible amount (if any)
```

### 8.3 Insufficient balance

Block at reserve step — never add reward line.

### 8.4 Concurrent redemption

Unique partial index on active reservations per customer; optimistic locking on `customer.currentPoints` or ledger-only balance check in transaction.

---

## 9. Void / Refund Integration (Future)

| Event | Ledger type |
|-------|-------------|
| Void paid order | `REVERSAL_VOID` — negative pointsDelta |
| Refund | `REVERSAL_REFUND` |

Never delete ledger rows. Link reversal to original `orderId` + original ledger entry id.

**BUSINESS_DECISION_REQUIRED:** Refund when points already redeemed.

---

## 10. Public Member Portal

### 10.1 URL architecture

| Route | Auth | Purpose |
|-------|------|---------|
| `/rewards/member/[token]` | None (token = secret) | Mobile portal |
| `GET /api/v1/public/rewards/member/:token` | Rate limited | Portal data API |

### 10.2 Response DTO (safe fields only)

```typescript
{
  phoneMasked: string;
  name?: string;
  currentPoints: number;
  nextReward: { name, pointsRequired, pointsRemaining } | null;
  eligibleRewards: Array<{ name, pointsRequired }>;
  catalog: Array<{ name, pointsRequired }>;
  recentActivity: Array<{ type, pointsDelta, label, date }>;
  // NO: full phone, internal ids, admin data
}
```

### 10.3 Portal restrictions

- **No redemption finalization** — display CTA "Gunakan Reward di Kasir" only
- Rate limit: 60 req/min per IP + 30 req/min per token
- Cache: `Cache-Control: private, max-age=30`

### 10.4 Rendering

Next.js App Router SSR page in `frontend/src/app/rewards/member/[token]/page.tsx` — new route group outside `(shell)` auth.

---

## 11. Configuration Integration

### 11.1 Loyalty program document

Single active program per business (V1 single-tenant):

```typescript
{
  _id: 'loyalty_program_default',
  enabled: false,              // feature gate
  pointEarnRate: 5000,
  version: 1,
  updatedAt
}
```

### 11.2 Reward catalog

```typescript
{
  _id, rewardCode, name, menuKode,
  pointsRequired, hppEstimate,
  status: 'active' | 'inactive',
  sortOrder
}
```

Seed catalog matches blueprint baseline (15–100 points rewards) via **one-time migration script**, not startup seed.

---

## 12. Feature Flag Integration

Architecture doc defines `loyalty.enabled` and `crm.enabled`. **Implement minimal backend check:**

```typescript
if (!(await loyaltyProgramRepository.isEnabled())) {
  return null; // skip loyalty in payOrder
}
```

Do not rely on frontend hiding alone.

---

## 13. Event Catalog (Future — Do Not Create in 28A)

| Event | Trigger |
|-------|---------|
| `CustomerRegistered` | New member |
| `CustomerIdentified` | Member linked to order |
| `LoyaltyPointsEarned` | Points credited |
| `RewardRedeemed` | Redemption completed |
| `LoyaltyPointsReversed` | Void/refund |
| `LoyaltyPointsExpired` | Expiry job (future) |
| `LoyaltyPointsAdjusted` | Manual adjustment |

Register handlers in new `LoyaltyModule` mirroring `PosModule` pattern.

---

## 14. Module Boundaries

```
backend/src/
  domain/loyalty/          Customer, LoyaltyLedgerEntry, Reward, Redemption
  application/loyalty/     LoyaltyService, EarnEngine, RedemptionService
  infrastructure/loyalty/    Mongo repos, LoyaltyModule
  presentation/routes/v1/
    loyalty.routes.ts        Authenticated cashier endpoints
    public-rewards.routes.ts Rate-limited public portal
```

**No changes to** `Order.pay()` business rules beyond optional field passthrough and event payload extension.

---

## 15. Backward Compatibility Rules

1. Orders without `customerId` — unchanged behavior
2. No retroactive points
3. Receipt without loyalty block — existing format preserved
4. API response additive — `loyalty?` optional field

---

## 16. Integration Risk Matrix

| Risk | Mitigation |
|------|------------|
| Double earn on retry | Unique ledger index + idempotent handler |
| Receipt shows wrong points | Server-calculated LoyaltyResult only |
| Phone duplicate customers | Unique phoneNormalized |
| QR exposes PII | publicMemberId token only |
| Startup menu mutation | Fix applyMenuCatalogPatches before go-live |
| Redemption HPP loss | Reward line with catalog price snapshot |

---

*End of Integration Blueprint*
