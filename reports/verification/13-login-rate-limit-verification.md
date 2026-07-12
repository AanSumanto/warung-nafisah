# Login Rate Limit — Verification

## Root cause

- [x] Identified: login rate limit (max 10) exceeded by integration test `beforeEach`
- [x] Not caused by API contract change, seed, or password hash

## Fix

- [x] Rate limit skipped in `NODE_ENV=test`
- [x] Production rate limit unchanged
- [x] Login helper with explicit assertions
- [x] Password test restores default password with assertions

## Tests

- [x] Backend: 104/104 PASS
- [x] `pos-mvp.test.ts`: 9/9 PASS
