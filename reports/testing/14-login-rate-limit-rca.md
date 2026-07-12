# Login Integration Test Failure — Root Cause Analysis

**Date:** 2026-07-12  
**Symptom:** `TypeError: Cannot read properties of undefined (reading 'token')`  
**Location:** `tests/integration/api/pos-mvp.test.ts` — `loginKasir.body.data.token`

## Summary

Login **did not fail** due to changed API contract, missing seed users, or invalid password hashing.

Login returned **HTTP 429** (rate limited) after the 10th request in a test run. The error response has **no `data` field**, so `body.data` was `undefined`.

## Investigation

| Check | Result |
|-------|--------|
| `POST /api/v1/auth/login` contract | Unchanged: `{ success: true, data: { token, user }, meta }` |
| `AuthService.login()` | Works when not rate limited |
| Seed users `kasir@` / `owner@` | Created in `seedPosData()` when `NODE_ENV !== 'production'` |
| Password `warung123` | Valid bcrypt hash, unchanged |
| Response wrapper | Success uses `data`; errors use `error` (no `data`) |

## Root Cause

**Sprint 4.5 security hardening** added login rate limit:

```typescript
rateLimit({ windowMs: 15 * 60 * 1000, max: 10 })
```

`pos-mvp.test.ts` calls login **twice in every `beforeEach`** (kasir + owner).

| Test # | Cumulative logins in beforeEach |
|--------|--------------------------------|
| 1–5 | 2, 4, 6, 8, 10 |
| **6+** | **11+ → 429 Too Many Requests** |

Failed tests (starting at test 6):

- `returns owner dashboard today`
- `rejects kasir from owner dashboard`
- `changes password for authenticated kasir`
- `rejects change password without auth`

Rate limit response (not `ResponseWrapper`):

```json
{
  "success": false,
  "error": {
    "code": "AUTH_429",
    "message": "Terlalu banyak percobaan login. Coba lagi nanti."
  }
}
```

No `data.token` → `TypeError` when test accessed token without assertions.

## Fix Applied

### 1. Application (root cause)

Skip login rate limit when `NODE_ENV === 'test'`:

```typescript
skip: () => getEnv().NODE_ENV === 'test',
```

Production behaviour unchanged (max 10 / 15 min).

### 2. Test hardening (diagnostics)

- Added `tests/helpers/auth/login.ts` — `loginAndGetToken()` with explicit assertions:
  - `expect(res.status).toBe(200)`
  - `expect(res.body.success).toBe(true)`
  - `expect(res.body.data).toBeDefined()`
  - `expect(res.body.data.token).toBeDefined()`
- Password change test now asserts restore and re-login with default password
- No optional chaining on token (per sprint rule)

## Secondary Risk (mitigated)

`changes password for authenticated kasir` mutates kasir password. Test now **asserts password restore** so later tests are not affected.

## Result

**104/104 backend tests PASS** (103 existing + 1 env guard test).
