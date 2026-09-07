# Nafisah Rewards V1 — Data Model Proposal

**Document ID:** WN-LOYALTY-DM-001  
**Date:** 2026-09-01  
**Status:** PROPOSAL ONLY — NO MIGRATIONS

---

## 1. Design Principles

- Ledger is source of truth for points; customer balance is cache
- Immutable snapshots on redemption and historical rewards
- Nullable `customerId` on orders for backward compatibility
- No retroactive data changes
- Align with existing patterns: string `_id` (UUID), Mongoose schemas, `TimestampDocument`

---

## 2. Collection Summary

| Collection | Type | New? |
|------------|------|------|
| `customers` | Aggregate | ✅ New |
| `loyalty_ledger` | Append-only ledger | ✅ New |
| `loyalty_rewards` | Config/catalog | ✅ New |
| `loyalty_program` | Config | ✅ New |
| `loyalty_redemptions` | Transactional | ✅ New |
| `customer_member_tokens` | Security (optional V1) | ⚠️ Optional |
| `orders` | Aggregate | 📝 Extend |
| `order_items` | Denormalized | 📝 Extend (optional) |

---

## 3. Customer Aggregate

### 3.1 Schema: `customers`

```typescript
interface CustomerDocument {
  _id: string;                    // UUID v4

  // Public identity (QR / portal)
  publicMemberId: string;         // 32+ char high-entropy, e.g. crypto.randomBytes(24).base64url
  publicMemberIdVersion: number;  // for rotation

  // Business identity
  phoneNormalized: string;        // E.164 without + → 628xxx UNIQUE
  phoneMasked: string;            // 08******890 — for display

  // Profile
  name?: string;                  // optional

  // Cached balances (reconcilable from ledger)
  currentPoints: number;          // default 0
  lifetimeEarnedPoints: number;   // default 0
  lifetimeRedeemedPoints: number; // default 0

  // Derived stats (optional cache — can compute from orders later)
  totalSpending?: number;         // member eligible spend cumulative
  transactionCount?: number;
  lastTransactionAt?: Date;

  status: 'active' | 'blocked' | 'merged';
  registeredAt: Date;
  registeredBy?: string;          // cashier userId
  createdAt: Date;
  updatedAt: Date;
}
```

### 3.2 Field placement rationale

| Field | Customer | Ledger | Derived |
|-------|----------|--------|---------|
| currentPoints | ✅ cache | ✅ authoritative sum | |
| lifetimeEarnedPoints | ✅ cache | derivable | |
| totalSpending | ⚠️ cache optional | | ✅ from orders+ledger |
| transactionCount | ⚠️ cache optional | | ✅ from orders |
| phone | ✅ | | |
| name | ✅ | snapshot on order | |

**Recommendation:** Keep `currentPoints` + `lifetimeEarnedPoints` as cache updated atomically with ledger writes. Defer `totalSpending`/`transactionCount` to analytics sprint unless needed for portal performance.

### 3.3 Indexes

```javascript
{ phoneNormalized: 1 }           // unique
{ publicMemberId: 1 }            // unique
{ status: 1, lastTransactionAt: -1 }
{ createdAt: -1 }
```

---

## 4. Loyalty Ledger

### 4.1 Schema: `loyalty_ledger`

```typescript
type LoyaltyLedgerType =
  | 'EARN_SALE'
  | 'REDEEM_REWARD'
  | 'REVERSAL_VOID'
  | 'REVERSAL_REFUND'
  | 'EXPIRY'
  | 'MANUAL_ADJUSTMENT';

interface LoyaltyLedgerDocument {
  _id: string;                    // UUID

  customerId: string;             // FK → customers
  orderId?: string;               // FK → orders (when applicable)
  orderNumber?: string;
  redemptionId?: string;          // FK → loyalty_redemptions

  type: LoyaltyLedgerType;
  pointsDelta: number;              // signed integer
  balanceAfter: number;             // snapshot after mutation

  reason: string;                 // human-readable
  actor: {
    type: 'system' | 'cashier' | 'owner' | 'job';
    userId?: string;
  };

  // Immutable business metadata
  metadata: {
    eligibleAmount?: number;
    pointEarnRate?: number;
    programVersion?: number;
    rewardSnapshot?: {
      rewardId: string;
      name: string;
      pointsCost: number;
      menuKode: string;
      hppEstimate: number;
    };
    reversalOfLedgerId?: string;
    note?: string;
  };

  idempotencyKey: string;         // e.g. `${customerId}:${orderId}:EARN_SALE`
  createdAt: Date;                // immutable — no updatedAt
}
```

### 4.2 Indexes

```javascript
{ idempotencyKey: 1 }                              // unique
{ customerId: 1, createdAt: -1 }                   // portal activity
{ orderId: 1, type: 1 }                            // reconciliation
{ customerId: 1, type: 1, createdAt: -1 }          // analytics
{ redemptionId: 1 }                                // sparse
```

### 4.3 Idempotency key patterns

| Type | Key |
|------|-----|
| EARN_SALE | `{customerId}:{orderId}:EARN_SALE` |
| REDEEM_REWARD | `{customerId}:{redemptionId}:REDEEM_REWARD` |
| REVERSAL_VOID | `{customerId}:{orderId}:REVERSAL_VOID` |
| MANUAL_ADJUSTMENT | `{customerId}:{uuid}:MANUAL_ADJUSTMENT` |

---

## 5. Loyalty Program Configuration

### 5.1 Schema: `loyalty_program`

```typescript
interface LoyaltyProgramDocument {
  _id: string;                    // 'default' for V1 single-tenant
  enabled: boolean;               // master feature gate
  pointEarnRate: number;          // 5000 — Rp per 1 point
  programName: string;            // 'Nafisah Rewards'
  version: number;
  effectiveFrom: Date;
  updatedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

**Not in env vars** — operational config.

---

## 6. Reward Catalog

### 6.1 Schema: `loyalty_rewards`

```typescript
interface LoyaltyRewardDocument {
  _id: string;
  rewardCode: string;             // e.g. 'RWD_ES_TEh' UNIQUE
  name: string;                   // 'Gratis Es Teh'
  menuKode: string;               // FK to menus.kodeMenu — MNM001 etc.
  pointsRequired: number;         // 15, 30, ...
  hppEstimate: number;            // Rp — for analytics
  status: 'active' | 'inactive';
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}
```

### 6.2 Baseline seed data (manual / one-time script)

| Points | Reward | menuKode | HPP |
|--------|--------|----------|-----|
| 15 | Gratis Es Teh | MNM001 | 1500 |
| 30 | Gratis Nasi Putih | NAS001 | 3000 |
| 45 | Gratis Model Gandum | MDG001 | 4500 |
| 60 | Gratis Cah Kangkung | SYR001 | 5000 |
| 75 | Gratis Lele | LL001 | 7000 |
| 100 | Gratis Ayam | AYM001 | 9000 |

**Install via explicit admin script — NOT startup seed.**

---

## 7. Redemption Entity

### 7.1 Schema: `loyalty_redemptions`

```typescript
type RedemptionStatus = 'reserved' | 'completed' | 'cancelled' | 'expired';

interface LoyaltyRedemptionDocument {
  _id: string;
  customerId: string;
  orderId?: string;               // set on pay
  rewardId: string;

  // Immutable snapshot at reservation time
  snapshot: {
    rewardCode: string;
    name: string;
    pointsCost: number;
    menuKode: string;
    menuName: string;
    catalogPrice: number;
    hppEstimate: number;
  };

  pointsSpent: number;
  status: RedemptionStatus;
  reservedAt: Date;
  reservedBy: string;             // cashierId
  completedAt?: Date;
  cancelledAt?: Date;
  ledgerEntryId?: string;         // REDEEM_REWARD ledger _id
  createdAt: Date;
  updatedAt: Date;
}
```

### 7.2 Indexes

```javascript
{ customerId: 1, status: 1 }
{ orderId: 1 }                    // sparse
{ status: 1, reservedAt: 1 }      // expiry job future
```

---

## 8. Order Aggregate Extension

### 8.1 New fields on `orders`

```typescript
interface OrderDocumentExtensions {
  customerId?: string;
  customerSnapshot?: {
    phoneMasked: string;
    name?: string;
  };
  loyaltySummary?: {
    pointsEarned: number;
    pointsRedeemed: number;
    eligibleAmount: number;
  };
}
```

Set `customerSnapshot` and `loyaltySummary` at pay time — immutable after `paid`.

### 8.2 Order item extension

```typescript
interface OrderItemEmbeddedExtensions {
  lineKind?: 'MENU' | 'REWARD';   // default 'MENU'
  redemptionId?: string;
  catalogPrice?: number;          // for REWARD lines
  pointsSpent?: number;
}
```

---

## 9. Optional: Member Token Rotation

If token rotation required in V1:

```typescript
interface CustomerMemberTokenDocument {
  _id: string;
  customerId: string;
  publicMemberId: string;
  status: 'active' | 'revoked';
  createdAt: Date;
  revokedAt?: Date;
}
```

Portal lookup: active token only. **V1 can use single token on Customer** with rotation as P2 enhancement.

---

## 10. Entity Relationship

```
customers 1──* loyalty_ledger
customers 1──* loyalty_redemptions
customers 1──* orders (optional FK)
loyalty_rewards 1──* loyalty_redemptions
orders 1──* loyalty_ledger (via orderId)
orders 1──* loyalty_redemptions
loyalty_redemptions 1──1 loyalty_ledger (REDEEM_REWARD)
menus 1──* loyalty_rewards (via menuKode reference)
```

---

## 11. API / DTO Mapping

### Customer (cashier view)

```typescript
{ id, phoneMasked, name, currentPoints, eligibleRewards[] }
// never full phone in list responses
```

### Customer (register response)

```typescript
{ id, phoneMasked, name, currentPoints, publicMemberId }  // publicMemberId only when needed for QR regen
```

### LoyaltyResult (pay response)

```typescript
{
  pointsEarned, currentPoints,
  nextReward: { name, pointsRequired, pointsRemaining },
  memberPortalUrl
}
```

---

## 12. Analytics Data Requirements

| Metric | Source |
|--------|--------|
| Member count | `customers` count |
| Active members | `lastTransactionAt` within window |
| Member vs non-member sales | `orders.customerId` presence + total |
| Points earned/redeemed | `loyalty_ledger` aggregation |
| Outstanding balance | sum `pointsDelta` or sum `currentPoints` |
| HPP reward cost | `loyalty_redemptions.snapshot.hppEstimate` |
| Top reward | group redemptions by rewardId |
| Dormant members | `lastTransactionAt` stale |

**No separate analytics tables in V1.**

---

## 13. Migration Strategy (Future)

1. Create collections + indexes (online, non-blocking)
2. Insert `loyalty_program` with `enabled: false`
3. Insert reward catalog via admin script
4. Deploy code with feature disabled
5. Enable `loyalty_program.enabled` when ready

**No changes to existing orders, menus, or payments.**

---

## 14. What NOT to Store

- Full phone in public API responses
- Points balance without ledger entry
- Mutable reward data on redemption records
- Business rules in frontend localStorage

---

*End of Data Model Proposal*
