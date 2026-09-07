# LOYALTY-01 — Customer Foundation Implementation Report

**Document ID:** WN-LOYALTY-01-IMP  
**Date:** 2026-09-07  
**Sprint:** LOYALTY-01 — Customer Foundation  
**Status:** COMPLETE

---

## 1. Summary

Implemented production-ready Customer Foundation for Nafisah Rewards V1:

- Customer domain aggregate
- Indonesian phone normalization + masking
- Cryptographically secure `publicMemberId`
- MongoDB `customers` collection with unique indexes
- Authenticated register / lookup / read APIs for `owner` and `kasir`
- Concurrency-safe duplicate phone prevention
- Full unit + integration + regression test coverage

**No loyalty points mutation, ledger, rewards, portal, QR, or POS payment changes.**

---

## 2. Files Created

### Domain
| File | Purpose |
|------|---------|
| `backend/src/domain/loyalty/phone.ts` | `normalizePhoneId`, `maskPhone` |
| `backend/src/domain/loyalty/publicMemberId.ts` | Secure token generation |
| `backend/src/domain/loyalty/LoyaltyTypes.ts` | `CustomerStatus` |
| `backend/src/domain/loyalty/Customer.ts` | Customer aggregate |
| `backend/src/domain/loyalty/ICustomerRepository.ts` | Narrow repository contract |
| `backend/src/domain/loyalty/index.ts` | Public exports |

### Application
| File | Purpose |
|------|---------|
| `backend/src/application/loyalty/CustomerService.ts` | Register / lookup / getById + DTO |

### Infrastructure
| File | Purpose |
|------|---------|
| `backend/src/infrastructure/loyalty/documents/CustomerDocument.ts` | Mongoose schema + indexes |
| `backend/src/infrastructure/loyalty/mappers/CustomerMapper.ts` | Document ↔ domain |
| `backend/src/infrastructure/loyalty/MongoCustomerRepository.ts` | Persistence |
| `backend/src/infrastructure/loyalty/LoyaltyModule.ts` | Module wiring + `createIndexes()` |

### Presentation
| File | Purpose |
|------|---------|
| `backend/src/presentation/routes/v1/customer.routes.ts` | Authenticated customer routes |

### Tests
| File | Purpose |
|------|---------|
| `backend/tests/unit/domain/loyalty-phone.test.ts` | Normalization + masking |
| `backend/tests/unit/domain/loyalty-public-member-id.test.ts` | Token entropy/URL-safety |
| `backend/tests/unit/domain/loyalty-customer.test.ts` | Aggregate rules |
| `backend/tests/unit/infrastructure/loyalty-customer-mapper.test.ts` | Mapper safety |
| `backend/tests/integration/infrastructure/loyalty-customer-repository.test.ts` | Unique constraints |
| `backend/tests/integration/api/loyalty-customer.test.ts` | API + concurrency + RBAC |

---

## 3. Files Modified

| File | Change |
|------|--------|
| `backend/src/infrastructure/pos/PosModule.ts` | Call `initializeLoyaltyInfrastructure()` after POS index setup |
| `backend/src/presentation/routes/v1/index.ts` | Mount `createCustomerRouter` |

**Untouched (verified):** `Order.ts`, `PosService.payOrder`, receipt/printing, bootstrap seed logic, menu master, frontend.

---

## 4. Architecture Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Entity base | `BaseEntity` | No domain events yet; AggregateRoot deferred to earn sprint |
| IDs | String UUID via `crypto.randomUUID()` | Matches POS `Identifier` convention |
| Phone utility | Domain module `phone.ts` | Single authoritative normalization |
| Duplicate response | `ValidationException` (400) | Matches existing POS duplicate-menu pattern |
| Concurrency guard | Unique index + E11000 mapping | Application find-then-insert insufficient alone |
| DTO privacy | No `phoneNormalized` in API | Masked phone only |
| Startup | `createIndexes()` only | No customer seed; PROD-DATA-01 compliant |
| Routes | `/api/v1/customers*` | Prompt-suggested; consistent with POS flat routes |

---

## 5. Customer Aggregate

```
Customer.register({ id, phone, name?, registeredBy })
→ phoneNormalized, phoneMasked, publicMemberId
→ counters = 0, status = active, registeredAt = now
```

Callers cannot supply point balances. `registeredBy` comes from JWT `sub` only.

---

## 6. Phone Normalization Rules

| Input | Result |
|-------|--------|
| `081234567890` | `6281234567890` |
| `6281234567890` | `6281234567890` |
| `+6281234567890` | `6281234567890` |
| whitespace / `-` / `()` / `.` | stripped then normalized |

**Rejected:** empty, alphabetic, too short/long, missing `0`/`62`/`+62` prefix, `6208…` (leading 0 after country code).

Canonical length: 10–15 digits after normalization.

---

## 7. Masking Algorithm

Canonical `62XXXXXXXX` → local `0XXXXXXXX` → `prefix(4) + *×n + suffix(2)`.

Example: `6281234567890` → `0812******90`.

---

## 8. publicMemberId Design

- `crypto.randomBytes(24).toString('base64url')` → 32 chars
- ~192 bits entropy, URL-safe `[A-Za-z0-9_-]`
- Not derived from phone or Mongo `_id`
- Stored as single active field; replaceable later for rotation
- Unique index enforced

---

## 9. Persistence & Indexes

Collection: `customers`

| Index | Unique | Purpose |
|-------|--------|---------|
| `phoneNormalized` | ✅ | Business identity |
| `publicMemberId` | ✅ | Portal/QR future |
| `status` | ❌ | Future filtering |

Setup: `initializeLoyaltyInfrastructure()` → `createCollection()` + `createIndexes()` (additive, never `syncIndexes`).

---

## 10. API Routes

| Method | Path | Auth |
|--------|------|------|
| POST | `/api/v1/customers` | owner, kasir |
| GET | `/api/v1/customers/lookup?phone=` | owner, kasir |
| GET | `/api/v1/customers/:customerId` | owner, kasir |

Response DTO: `id`, `publicMemberId`, `phoneMasked`, `name?`, counters, `status`, `registeredAt`.  
**Never returns** `phoneNormalized` or raw Mongo document.

---

## 11. Duplicate & Concurrency

1. Pre-check by `phoneNormalized` → friendly 400
2. Unique index → final guard
3. E11000 mapped to `ValidationException('Nomor HP sudah terdaftar')` — no Mongo internals leaked
4. Concurrent 8× registration test → exactly 1 customer

---

## 12. Explicit Confirmations

| Guardrail | Status |
|-----------|--------|
| POS pay flow untouched | ✅ |
| Menu/bootstrap master data logic untouched | ✅ (`runDatabaseBootstrap` unchanged) |
| No customer startup seed | ✅ |
| No loyalty ledger / rewards / portal / QR | ✅ |
| No frontend checkout changes | ✅ |
| No new npm dependencies | ✅ |

---

## 13. Known Gaps (deferred)

- No POS UI member attachment (LOYALTY-04)
- No point earn/redeem (LOYALTY-03+)
- No public portal (LOYALTY-06)
- No customer list/enumerate (intentional)
- No merge workflow
- `merged` status reserved in docs only

---

## 14. Recommendation

LOYALTY-01 is ready for review. **LOYALTY-02 may begin after approval.**
