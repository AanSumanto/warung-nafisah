# Sprint 2 — Core Framework Test Results

**Document ID:** WN-TEST-S2-001  
**Version:** 0.6.0  
**Date:** 2026-07-11  
**Runner:** Vitest 2.1.9

---

## Summary

| Metric | Value |
|--------|-------|
| Framework | Vitest 2.x |
| Test files | 10 |
| Tests | 56 |
| Build (`tsc`) | ✅ PASS |
| Result | ✅ ALL PASS |

---

## Sprint 2 Domain Unit Tests (32 tests)

### `tests/unit/domain/Result.test.ts` — 7 tests

| Test | Result |
|------|--------|
| creates ok result | ✅ |
| creates fail result | ✅ |
| maps ok values | ✅ |
| flatMaps chained results | ✅ |
| unwrapOr returns fallback | ✅ |
| combine aggregates ok results | ✅ |
| combine short-circuits on failure | ✅ |

### `tests/unit/domain/Either.test.ts` — 5 tests

| Test | Result |
|------|--------|
| creates left and right values | ✅ |
| maps right values | ✅ |
| skips map on left | ✅ |
| maps left values with mapLeft | ✅ |
| folds to a single value | ✅ |

### `tests/unit/domain/Money.test.ts` — 9 tests

| Test | Result |
|------|--------|
| creates IDR money | ✅ |
| adds / subtracts / multiplies | ✅ |
| compares amounts | ✅ |
| detects zero | ✅ |
| allocates by ratios | ✅ |
| currency mismatch throws | ✅ |
| IDR display format | ✅ |

### `tests/unit/domain/ValueObject.test.ts` — 5 tests

| Test | Result |
|------|--------|
| equality by value | ✅ |
| validation on construction | ✅ |
| immutability (frozen props) | ✅ |
| toJSON serialization | ✅ |
| inequality for different values | ✅ |

### `tests/unit/domain/BaseEntity.test.ts` — 3 tests

| Test | Result |
|------|--------|
| assigns id and timestamps | ✅ |
| equals by id | ✅ |
| touch updates updatedAt | ✅ |

### `tests/unit/domain/AggregateRoot.test.ts` — 3 tests

| Test | Result |
|------|--------|
| collects domain events | ✅ |
| clears domain events | ✅ |
| reports hasDomainEvents | ✅ |

---

## Regression (Sprint 1 + Hotfix) — 24 tests

| Suite | Tests | Result |
|-------|-------|--------|
| response-wrapper | 2 | ✅ |
| health integration | 4 | ✅ |
| redis-url | 16 | ✅ |
| redis-connect | 2 | ✅ |

---

## Commands

```bash
cd backend
npm run build
npm test
```

---

## Verdict

All Sprint 2 required domain tests pass. Sprint 1 regression intact.
