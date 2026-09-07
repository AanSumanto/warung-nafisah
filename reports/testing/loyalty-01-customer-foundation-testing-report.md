# LOYALTY-01 — Customer Foundation Testing Report

**Document ID:** WN-LOYALTY-01-TEST  
**Date:** 2026-09-07  
**Status:** PASS

---

## 1. Test Inventory

| Suite | File | Tests |
|-------|------|-------|
| Phone normalize/mask | `tests/unit/domain/loyalty-phone.test.ts` | 11 |
| publicMemberId | `tests/unit/domain/loyalty-public-member-id.test.ts` | 3 |
| Customer aggregate | `tests/unit/domain/loyalty-customer.test.ts` | 5 |
| Mapper | `tests/unit/infrastructure/loyalty-customer-mapper.test.ts` | 2 |
| Repository | `tests/integration/infrastructure/loyalty-customer-repository.test.ts` | 3 |
| API + concurrency + RBAC | `tests/integration/api/loyalty-customer.test.ts` | 8 |
| **LOYALTY-01 total** | | **32** |

---

## 2. Coverage Mapping

| Requirement | Covered by |
|-------------|------------|
| 0812 / 62 / +62 same canonical | phone unit |
| Whitespace / separators | phone unit |
| Invalid alphabetic / empty / short / long / bad prefix | phone unit |
| Masking format | phone unit |
| publicMemberId URL-safe + unique sample | publicMemberId unit |
| Counters zero / active / optional name | customer unit |
| Mapper reconstitution / string id | mapper unit |
| Unique phone + publicMemberId DB | repository integration |
| owner / kasir register+lookup+read | API integration |
| Unauthenticated 401 | API integration |
| Duplicate equivalent phone | API integration |
| Concurrent registration → count=1 | API integration |
| Indexes unique | API integration |
| No customer seed; menus intact | API integration |

---

## 3. Results (2026-09-07)

```
LOYALTY-01 focused: 6 files, 32 tests — PASS
Full backend suite: 28 files, 149 tests — PASS
```

Command:

```bash
cd backend && npm test -- --run
```

---

## 4. Regression Areas Verified Green

- POS MVP API (`pos-mvp.test.ts`) — 12 tests
- Database bootstrap (`database-bootstrap.test.ts`) — 7 tests
- Event platform — 8 tests
- Persistence framework — 9 tests
- Auth / CORS / health — green

---

## 5. Isolation

All Mongo tests use `MongoMemoryReplSet` via `setupMongoMemoryServer()`.  
**No production MongoDB access.**

---

## 6. Gaps

None for LOYALTY-01 scope. Point mutation / ledger / portal tests intentionally absent.
