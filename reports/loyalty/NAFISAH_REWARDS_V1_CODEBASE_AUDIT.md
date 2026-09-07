# Nafisah Rewards V1 — Production Codebase Audit

**Document ID:** WN-LOYALTY-AUDIT-001  
**Date:** 2026-09-01  
**Status:** DISCOVERY COMPLETE — NO IMPLEMENTATION  
**Blueprint Reference:** NAFISAH_REWARDS_V1_BLUEPRINT.docx (locked business rules supplied via Prompt 28A; `.docx` not present in repository)

---

## Executive Summary

Warung Nafisah ERP is a production POS MVP (Sprint 4.5.x) with a clean domain-driven backend, transactional outbox event platform, and a frontend-only receipt pipeline. **Sales complete at `Order.pay()` with status `paid` and a `SaleCompleted` domain event.** There is **no existing Customer, Member, Loyalty, or Reward domain** in code. The event infrastructure is ready for a `SaleCompleted` consumer with idempotent handler logging, but no loyalty handlers are registered today.

**Recommended loyalty integration point:** post-commit idempotent `SaleCompleted` handler **plus** synchronous loyalty result returned in `payOrder` API response (for receipt rendering without recalculation).

**Overall readiness:** `PASS_WITH_GAPS` — safe to begin foundation sprints; P1 gaps must be closed before production loyalty activation.

---

## Section A — Existing POS Transaction Flow

### End-to-end trace

```
Cashier UI (frontend)
  → local cart state (React)
  → POST /orders (draft)
  → PUT /orders/:id/items (menu price snapshots)
  → POST /orders/:id/pay (payment + completion)
  → Backend PosService.payOrder()
  → Mongo transaction: save order + payment + outbox
  → OutboxDispatcher → business_events + handler dispatch
  → Frontend ReceiptBuilder.build() → print
```

### Evidence: Frontend checkout

| Step | File | Function / Symbol |
|------|------|-------------------|
| Cart state | `frontend/src/app/(shell)/pos/page.tsx` | `usePosCart()` — local only |
| Pay handler | same | `handlePay()` lines 134–163 |
| API calls | `frontend/src/features/pos/api.ts` | `createOrder`, `updateOrderItems`, `payOrder` |
| Hooks | `frontend/src/features/pos/hooks.ts` | `useCreateOrder`, `useUpdateOrderItems`, `usePayOrder` |
| Payment UI | `frontend/src/features/pos/components/PaymentBottomSheet.tsx` | Cash / QRIS / Transfer |

**Current behavior:** Three sequential API calls on "Selesaikan & Cetak". No member lookup. Cart cleared after success. Receipt built client-side from returned `Order`.

**Risk:** P3 — Network retry on `payOrder` could theoretically double-pay if idempotency key not added at API layer (order is already draft; pay is guarded by `assertDraft()`).

**Recommended architecture:** Keep three-step flow; add optional `customerId`/`memberToken` on create or pay. Add `Idempotency-Key` header on pay for API-level dedup (future).

**Implementation impact:** Frontend POS page, payment sheet, API types.

**Severity:** P2

---

### Evidence: Backend routes

| Route | Method | Handler | Auth |
|-------|--------|---------|------|
| `/api/v1/orders` | POST | `PosService.createDraftOrder` | kasir/owner |
| `/api/v1/orders/:orderId/items` | PUT | `PosService.updateOrderItems` | kasir/owner |
| `/api/v1/orders/:orderId/pay` | POST | `PosService.payOrder` | kasir/owner |
| `/api/v1/orders/today` | GET | `PosService.listTodayOrders` | kasir/owner |

**File:** `backend/src/presentation/routes/v1/pos.routes.ts`

**Schemas:** No customer/loyalty fields in `createOrderSchema`, `updateItemsSchema`, or `payOrderSchema`.

**Severity:** P1 (must extend schemas for member attachment)

---

### Evidence: Authoritative completion moment

**Finding:** Sale is financially/business completed inside `Order.pay()`, not on a separate "completed" status.

| Attribute | Value |
|-----------|-------|
| Domain method | `Order.pay()` |
| File | `backend/src/domain/pos/Order.ts` lines 139–196 |
| Terminal status | `'paid'` (not `'completed'`) |
| Domain event | `SaleCompleted` |
| Timestamp | `paidAt` set at pay time |
| Service entry | `PosService.payOrder()` lines 213–241 |

```139:167:backend/src/domain/pos/Order.ts
  pay(paymentMethod: PaymentMethod, tender?: PaymentTender, correlationId?: string): Order {
    this.assertDraft();
    // ...
    const paid = new Order(this.id, {
      ...this.orderRecord,
      status: 'paid',
      paymentMethod,
      paidAmount,
      changeAmount,
      paidAt,
    }, this.createdAt, paidAt);
```

**Event payload fields:** `orderId`, `orderNumber`, `diningType`, `paymentMethod`, `total`, `paidAmount`, `changeAmount`, `cashierId`, `cashierName`, `shiftId`, `paidAt`, `items[]`.

**Gap:** No `customerId` in payload.

**Recommended architecture:** `SaleCompleted` remains the canonical business event; extend payload with optional `customerId` and `loyaltyEarned` summary after loyalty module exists.

**Severity:** P1

---

### Evidence: Transaction atomicity on pay

**File:** `backend/src/application/pos/PosService.ts` lines 220–240

Within `unitOfWork.execute()`:
1. Load order, call `order.pay()`
2. `orderRepository.save(paid)`
3. `paymentWriter.persistPaidOrder(..., session)`
4. `eventPublisher.publish(SaleCompleted, session)` → outbox

After commit: `outboxDispatcher.dispatchPending()`

**Mongo transaction infrastructure:**
- `MongoUnitOfWork`, `MongoTransactionManager`, `transaction-retry.ts`
- Session propagated to repositories and outbox

**Recommended architecture for loyalty earn:** Option **A + C hybrid** — write loyalty ledger entry **inside same Mongo transaction** as pay (when member attached), **and** register idempotent `SaleCompleted` handler as safety net / async reconciliation.

**Severity:** P1

---

### Evidence: Inventory and financial effects

| Effect | Status | Evidence |
|--------|--------|----------|
| Inventory deduction | **Not implemented** | No inventory module/handlers |
| Payment record | **Implemented** | `PaymentWriter.persistPaidOrder()` → `payments` collection |
| Order items denorm | **Implemented** | `order_items` collection on pay |
| Cashflow ledger | **Not implemented** | Dashboard aggregates `payments` directly |
| HPP/profit on event | **Not in payload** | `SaleCompleted` has no hpp/profit (unlike frozen catalog spec) |

**Severity:** P2 — loyalty eligible amount should use order `total` minus reward lines (future), not depend on inventory.

---

### Evidence: Audit / event effects

| Component | File | Behavior |
|-----------|------|----------|
| Outbox | `MongoOutboxRepository` | Transactional enqueue |
| Event store | `MongoEventStore` → `business_events` | Append-only |
| Dispatcher | `InProcessEventDispatcher` | Idempotent via `event_consumer_log` |
| Registered handlers | `PosModule.ts` | **Only** `AuditTimelineProjection` (in-memory) |
| `SaleCompleted` handlers | `EventRegistry` | **Zero** business handlers |

**Severity:** P2 — event platform is reusable; loyalty handler registration is greenfield.

---

## Section B — Order / Sale Aggregate

### Current model

| Field | Type | Notes |
|-------|------|-------|
| `_id` | UUID string | Mongo primary key |
| `orderNumber` | string | `WN-YYYYMMDD-NNNNNN`, unique index |
| `status` | `'draft' \| 'paid' \| 'cancelled'` | No `'completed'` |
| `diningType` | `'dine_in' \| 'take_away'` | |
| `cashierId`, `cashierName` | string | From JWT |
| `shiftId` | string? | From open shift |
| `items[]` | embedded snapshots | Price frozen at item update |
| `total` | number | Sum of item subtotals |
| `paymentMethod` | cash/qris/transfer | Set at pay |
| `paidAmount`, `changeAmount` | number | Set at pay |
| `paidAt` | Date | Set at pay |

**Files:** `backend/src/domain/pos/Order.ts`, `backend/src/infrastructure/pos/documents/OrderDocument.ts`

**Not present:** discount, tax, outlet, customerId, loyalty fields, receipt number.

### Source of truth

| Concern | Source of truth |
|---------|-----------------|
| Order state | `orders` collection |
| Payment fact | `payments` collection (`amount` = order total) |
| Business event | `business_events` (`SaleCompleted`) |
| Line item history | Embedded in order + denormalized `order_items` |

### Void / refund model

| Capability | Domain | API | Event |
|------------|--------|-----|-------|
| Cancel draft | `Order.cancel()` | ❌ | ❌ |
| Void paid | ❌ | ❌ | `SaleVoided` (docs only) |
| Refund | ❌ | ❌ | `SaleRefunded` (docs only) |

**Risk P1:** No reversal path for loyalty yet; must design before go-live.

### Recommended customer attachment point

**Attach at order creation or first member lookup (draft phase), persist on Order:**

```typescript
customerId?: string;           // internal FK
customerSnapshot?: {           // optional immutable mini-snapshot at pay
  phoneMasked: string;
  name?: string;
};
loyaltyRedemptionId?: string;  // if reward applied pre-pay
```

**Why draft phase:** Cashier workflow "Pilih menu → optional member → bayar". Member can be linked before pay without blocking non-member flow.

**Severity:** P1

---

## Section C — Customer Domain

### Search results

Grep across `backend/src` for `Customer|Member|Loyalty|customerId|phoneNormalized`: **no matches**.

Architecture freeze documents reference CRM events (`CustomerRegistered`, `LoyaltyPointsEarned`) and collections (`projection_customer_spend`) — **not implemented in code**.

### Existing entities (partial reuse)

| Entity | Reusable? | Reason |
|--------|-----------|--------|
| `User` | ❌ | Staff auth (owner/kasir), not customer |
| `Order` | Extend | Attach optional `customerId` |
| `Menu` | ✅ | Reward catalog links to menu items |

### Recommendation

Create **dedicated Customer aggregate** — do not overload `User`.

**Severity:** P1

---

## Section D — Database Safety (Startup)

### Bootstrap flow

**File:** `backend/src/infrastructure/database/bootstrap/runDatabaseBootstrap.ts`

1. `ensureSystemBootstrapCollection()`
2. **`applyMenuCatalogPatches()` — EVERY STARTUP**
3. If `system_bootstrap` doc exists → skip `installInitialData()`
4. Else → `installInitialData()` once

### Finding: Menu catalog patches on every restart

**File:** `backend/src/infrastructure/auth/seedPosData.ts` lines 204–218

```204:218:backend/src/infrastructure/auth/seedPosData.ts
export async function applyMenuCatalogPatches(): Promise<void> {
  const model = getMenuModel();
  for (const patch of MENU_CATALOG_PATCHES) {
    await model.updateOne({ kodeMenu: patch.kodeMenu }, { $set: { ... } });
  }
}
```

**Current behavior:** `$set` overwrites `kodeKategori`, `namaKategori`, optionally `namaMenu` for MNM003 and ADD001 on **every application start**.

**Risk:** Operator edits to those fields are silently reverted on restart.

**Severity:** **P1** (not P0 — limited to 2 menu codes, insert-only seed otherwise gated)

### Initial seed safety

| Function | Behavior | Risk |
|----------|----------|------|
| `seedInitialMenus()` | `$setOnInsert` upsert | ✅ Safe — no overwrite |
| `seedInitialUsers()` | Skipped in production | ✅ Safe |
| `installInitialData()` | Once per DB | ✅ Gated by `system_bootstrap` |

### syncIndexes on startup

`initializePosInfrastructure()` syncs indexes on menus, orders, payments, events, etc. — idempotent, generally safe.

**Severity:** P3

---

## Section E — Transaction Atomicity (Loyalty Consistency)

### Current sale completion

Uses MongoDB multi-document transaction in `payOrder`.

### Options evaluation

| Option | Fit | Recommendation |
|--------|-----|----------------|
| A. Same Mongo transaction | ✅ Best fit | Ledger write + order save + outbox in one session |
| B. Transactional outbox only | ✅ Already exists | `SaleCompleted` → async handler |
| C. Post-commit idempotent consumer | ✅ Safety net | Handler with unique index dedup |
| D. External message bus | ❌ Overkill | Not in codebase |

**Recommended:** **A primary + C secondary**

1. **Synchronous (pay transaction):** If `customerId` present and `loyalty.enabled`, compute points, insert `loyalty_ledger` EARN_SALE with unique `(customerId, orderId, type)`, update `customer.currentPoints` cache.
2. **Async handler:** `SaleCompleted` → `LoyaltyEarnHandler` checks ledger idempotency key; no-op if already earned.
3. **Return `LoyaltyResult`** in pay API response for receipt (no frontend calculation).

**Idempotency key:** `{ customerId, orderId, type: 'EARN_SALE' }` — unique compound index on ledger.

**Severity:** P1

---

## Section F — Receipt Pipeline

### Verified architecture

Matches approved blueprint:

```
Order snapshot → ReceiptBuilder → Receipt → PreviewRenderer | EscPosRenderer → RawBtPrinterAdapter
```

| Component | File | Status |
|-----------|------|--------|
| ReceiptBuilder | `frontend/src/features/printing/receipt/ReceiptBuilder.ts` | ✅ |
| Receipt interface | `frontend/src/features/printing/types/receipt.ts` | ✅ |
| PreviewRenderer | `frontend/src/features/printing/renderers/PreviewRenderer.ts` | ✅ |
| EscPosRenderer | `frontend/src/features/printing/renderers/EscPosRenderer.ts` | ✅ |
| RawBtPrinterAdapter | `frontend/src/features/printing/adapters/RawBtPrinterAdapter.ts` | ✅ |
| PrintService | `frontend/src/features/printing/services/PrintService.ts` | ✅ |

### Future loyalty fields (consume-only)

Extend `Receipt` interface — **do not calculate in renderers**:

```typescript
loyalty?: {
  memberPhoneMasked?: string;
  pointsEarned?: number;
  currentPoints?: number;
  nextRewardName?: string;
  pointsToNextReward?: number;
  memberPortalUrl?: string;  // for QR encoding
};
```

**ReceiptBuilder** maps from `Order` + `LoyaltyResult` passed separately (from pay API response).

**Severity:** P2

---

## Section G — QR Code Support

| Capability | Status | Evidence |
|------------|--------|----------|
| QR npm library | ❌ | No dependency in package.json |
| ESC/POS QR commands | ❌ | `EscPosRenderer` — text only |
| Profile flag | ✅ unused | `supportsQr: true` in `printerProfile.ts` |
| RawBT QR | ❌ | Not implemented |

**Recommended V1 approach:** **D — Combination with fallback**

1. **Primary:** Native ESC/POS QR (`GS ( k` model 2) in `EscPosRenderer` when `profile.supportsQr` — no new npm dep if commands hand-coded.
2. **Fallback:** Print `memberPortalUrl` as text line if QR command fails or printer rejects.
3. **Preview:** Browser-side QR in `PreviewRenderer` only (optional small lib or API-generated SVG in portal sprint).

**Severity:** P2

---

## Section H — Redemption in POS

### Recommendation: Special order line + redemption entity

**Model reward as:**

1. **`loyalty_redemptions` document** — immutable snapshot (rewardId, rewardName, pointsCost, menuKode, hppSnapshot, status).
2. **Order line with `lineKind: 'REWARD'`** — `hargaJual` = catalog price snapshot, `customerPaid` = 0 via `rewardDiscount` or explicit `lineType` metadata.

**Do NOT** use arbitrary manual discount — destroys HPP/reporting.

**Flow:**
```
Cashier selects eligible reward → creates/links redemption (RESERVED)
→ adds reward line to draft order at Rp0 effective
→ on pay: REDEEM_REWARD ledger entry + link redemption to orderId
```

**Eligible spend for earn:** `total - sum(reward line catalog values)` or exclude reward lines from eligible amount.

**Severity:** P1

---

## Section I — Void / Refund

| Action | Implementation | Loyalty risk |
|--------|----------------|--------------|
| Draft cancel | Domain only | None |
| Paid void | ❌ | P1 — points would remain |
| Refund | ❌ | P1 — no clawback |
| Delete order | ❌ | ✅ No delete API |

**Future rule:** `REVERSAL_VOID` / `REVERSAL_REFUND` ledger entries; never delete ledger.

**Severity:** P1 before void/refund go-live

---

## Section J — Configuration Engine

| Layer | Status |
|-------|--------|
| `tenant_settings` collection | ❌ Not in code |
| Feature flags runtime | ❌ Docs only (`reports/security/03-feature-flags.md`) |
| Env vars | ✅ `backend/src/config/env.ts` — infra only |
| Print config | ✅ localStorage frontend |

**Recommendation:** New `loyalty_program` + `loyalty_rewards` collections (or nested in future `tenant_settings`).

**Do not** hardcode `5000` or reward catalog in React.

**Severity:** P1

---

## Section K — Security & Privacy (summary)

See dedicated `NAFISAH_REWARDS_V1_SECURITY_REVIEW.md`.

Key gaps: no public token pattern, no rate limiting on public endpoints, phone PII not yet handled, RBAC only owner/kasir implemented.

---

## Section L — Performance (summary)

Recommended indexes (future):

- `customers.phoneNormalized` UNIQUE
- `customers.publicMemberId` UNIQUE
- `loyalty_ledger.{ customerId, createdAt }`
- `loyalty_ledger.{ customerId, orderId, type }` UNIQUE partial

Cashier phone search: indexed prefix on `phoneNormalized`.

---

## Section M — Analytics Readiness

Persist: ledger entries, customer snapshots on redemption, `customerId` on orders (nullable).

Derive: AOV, repeat visit, redemption rate, loyalty cost ratio from ledger + orders queries.

Avoid separate analytics tables in V1.

---

## Section N — Frontend UX Integration

**Minimal additions to `frontend/src/app/(shell)/pos/page.tsx` ecosystem:**

| UI element | Location suggestion |
|------------|---------------------|
| Member / Non-member chip | Cart panel header |
| Phone search + quick register | Modal/sheet before payment |
| Member summary (points, eligible rewards) | Payment bottom sheet |
| Redeem reward CTA | Payment sheet or cart |
| Post-pay loyalty result | Receipt preview sheet |

**Must not block checkout** — member optional.

---

## Section O — Public Member Portal (summary)

Route: `/rewards/member/[publicMemberId]` (Next.js App Router, SSR/API).

See Integration Blueprint for full design.

---

## Section P — Backward Compatibility

- `customerId` nullable on Order — historical orders unaffected
- No retroactive point awards
- Receipt renders without `loyalty` block when absent

---

## Section Q — Go-Live Strategy (summary)

Phased rollout with backend `loyalty.enabled` flag (to be implemented). See Roadmap.

---

## Reusable Components Inventory

| Component | Reusable for loyalty? |
|-----------|----------------------|
| Event outbox + store | ✅ Yes |
| `InProcessEventDispatcher` + consumer log | ✅ Yes |
| `MongoUnitOfWork` / transactions | ✅ Yes |
| `Order` aggregate + pay flow | ✅ Extend |
| `ReceiptBuilder` / printing stack | ✅ Extend |
| `User` entity | ❌ No |
| Feature flags | ❌ Must build |
| Customer / ledger | ❌ Must build |
| Public token service | ❌ Must build |

---

## Test Strategy (Future)

See Implementation Roadmap — 18 cases defined in Prompt 28A preserved there.

---

*End of Codebase Audit*
