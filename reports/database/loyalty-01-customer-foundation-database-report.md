# LOYALTY-01 — Customer Foundation Database Report

**Document ID:** WN-LOYALTY-01-DB  
**Date:** 2026-09-07  
**Status:** PASS

---

## 1. New Collection

**Name:** `customers`  
**Type:** Additive transactional aggregate  
**Seed on startup:** None  
**Backfill:** None  
**Impact on existing orders/menus/payments:** None

---

## 2. Document Shape

| Field | Type | Notes |
|-------|------|-------|
| `_id` | String (UUID) | Internal customer id |
| `publicMemberId` | String | Opaque token, unique |
| `phoneNormalized` | String | Canonical `62…`, unique |
| `phoneMasked` | String | Display form |
| `name` | String? | Optional |
| `currentPoints` | Number | Init 0 — cache for future ledger |
| `lifetimeEarnedPoints` | Number | Init 0 |
| `lifetimeRedeemedPoints` | Number | Init 0 |
| `totalSpending` | Number | Init 0 |
| `transactionCount` | Number | Init 0 |
| `lastTransactionAt` | Date \| null | Init null |
| `status` | `active` \| `blocked` | Init active |
| `registeredAt` | Date | |
| `registeredBy` | String | Actor user id |
| `createdAt` / `updatedAt` | Date | |

Schema: `backend/src/infrastructure/loyalty/documents/CustomerDocument.ts`  
`versionKey: false` (matches POS documents).

---

## 3. Indexes

| Key | Unique | Source |
|-----|--------|--------|
| `phoneNormalized: 1` | ✅ | schema `unique: true` |
| `publicMemberId: 1` | ✅ | schema `unique: true` |
| `status: 1` | ❌ | schema `index: true` |
| `_id` | ✅ (default) | MongoDB |

Verified in integration test via `collection.indexes()`.

**Index strategy:** additive `model.createIndexes()` only.  
**Forbidden:** `syncIndexes()`, `dropIndexes()`, destructive rebuild.

---

## 4. Startup Behavior

```
bootstrapInfrastructure()
  → initializePosInfrastructure()
       → … POS collections createIndexes
       → initializeLoyaltyInfrastructure()  // NEW
            → createCollection('customers') if missing
            → createIndexes()
  → runDatabaseBootstrap()  // UNCHANGED — no customer seed
```

---

## 5. Compatibility with PROD-DATA-01

| Rule | Compliance |
|------|------------|
| No master data mutation every start | ✅ |
| No seedCustomers / patchCustomers | ✅ |
| createIndexes not syncIndexes | ✅ |
| Existing menus untouched | ✅ (regression test) |

---

## 6. Future Collections (NOT created)

- `loyalty_ledger`
- `loyalty_program`
- `loyalty_rewards`
- `loyalty_redemptions`

---

## 7. Migration Notes for Production (later)

When deploying LOYALTY-01:

1. Deploy code
2. Controlled PM2 reload
3. Startup creates `customers` collection + indexes additively
4. Verify indexes: `db.customers.getIndexes()`
5. Verify menu count unchanged
6. Smoke POS sale
7. Optionally register one deliberate test member (authorized only)

**Do not run this migration against production from this sprint.**
