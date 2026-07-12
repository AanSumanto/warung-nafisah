# Money Value Object — Architecture Freeze

**Document ID:** WN-DOM-001  
**Version:** 1.0.0 (Phase 0.5)  
**Status:** FROZEN

---

## 1. Rule

> **Never use raw `number` for money in Domain layer.**  
> All monetary values use `Money` value object.

---

## 2. Structure (Frozen)

```typescript
interface Money {
  amount: string;           // Integer string in minor units OR whole units — see precision
  currency: CurrencyCode;   // ISO 4217 — default "IDR"
  precision: number;        // Decimal places — IDR = 0
  roundingMode: RoundingMode;
}

type CurrencyCode = 'IDR' | string;  // IDR only for MVP
type RoundingMode = 'HALF_UP' | 'HALF_DOWN' | 'CEILING' | 'FLOOR';
```

---

## 3. Field Rules

| Field | IDR Default | Description |
|-------|-------------|-------------|
| `amount` | `"45000"` | String to avoid float errors; whole rupiah |
| `currency` | `"IDR"` | From `tenant_settings.currency` |
| `precision` | `0` | IDR has no sen |
| `roundingMode` | `"HALF_UP"` | For division/allocation |

---

## 4. Operations (MoneyDomainService)

| Operation | Rule |
|-----------|------|
| `add(a, b)` | Same currency required |
| `subtract(a, b)` | Same currency; throws if negative not allowed |
| `multiply(money, qty)` | qty is number; apply rounding |
| `allocate(total, ratios[])` | Split with remainder on last item |
| `compare(a, b)` | Returns -1, 0, 1 |
| `isZero()` | amount === "0" |
| `toDisplay()` | `"Rp 45.000"` Indonesian format |
| `toJSON()` | Serialized for event payload |

---

## 5. Storage

| Layer | Format |
|-------|--------|
| MongoDB | Embedded object `{ amount, currency, precision, roundingMode }` |
| Event payload | Same |
| API response | Same |
| Frontend | Parse to Money type; display via formatter |

---

## 6. Prohibited

```typescript
// ❌ FORBIDDEN in domain
const total = price * quantity;
const profit = total - hpp;

// ✅ REQUIRED
const total = MoneyDomainService.multiply(price, quantity);
const profit = MoneyDomainService.subtract(total, hpp);
```

---

## 7. Migration Note

Transactional collections from v1.1 ERD with `Number` fields will be implemented as Money embedded documents in Phase 1 schemas.
