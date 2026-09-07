# LOYALTY-01 — Customer Foundation Security Review

**Document ID:** WN-LOYALTY-01-SEC  
**Date:** 2026-09-07  
**Status:** PASS

---

## Security Checklist Answers

### 1. Can raw phone leak through API response?

**PASS**

Evidence: `toCustomerDto()` returns `phoneMasked` only; integration test asserts `phoneNormalized` is `undefined` in register/lookup/read responses.

---

### 2. Can raw phone leak through logs?

**PASS**

Evidence: CustomerService / routes do not `console.log` phone or registration payload. Failures use generic ValidationException messages. Operational identifiers are customer id / request id via ResponseWrapper meta.

---

### 3. Can publicMemberId be guessed?

**PASS**

Evidence: `crypto.randomBytes(24)` → base64url (32 chars, ~192 bits). Not sequential. Uniqueness enforced. Brute force impractical.

---

### 4. Is publicMemberId derived from phone?

**PASS**

Evidence: Generated independently via `generatePublicMemberId()`. Unit test asserts token does not contain phone fragments. Optional override only for tests with fixed token.

---

### 5. Can two equivalent phone formats create duplicate members?

**PASS**

Evidence: Normalization unifies `08` / `62` / `+62`. API test registers `081234567890` then rejects `+6281234567890`. DB count = 1.

---

### 6. Can two simultaneous requests create duplicate members?

**PASS**

Evidence: Unique index on `phoneNormalized` + E11000 mapping. Concurrent test (8 parallel POSTs) → exactly 1 success, count = 1.

---

### 7. Can unauthenticated users enumerate customers?

**PASS**

Evidence: All routes use `createAuthMiddleware`. Unauthenticated POST → 401. No public customer endpoints.

---

### 8. Can cashier enumerate all customer records?

**PASS**

Evidence: No list/search-all endpoint. Only precise phone lookup and get-by-id. Repository contract has no `findAll` exposure for cashiers.

---

### 9. Does any API expose Mongo ObjectId unnecessarily?

**PASS**

Evidence: String UUID `_id`. Response uses `id` field. No ObjectId type in schema.

---

### 10. Is there any public customer endpoint?

**PASS**

Evidence: `customer.routes.ts` — all routes require `auth` + `requireRole('owner','kasir')`. No `/public` or `/rewards` routes.

---

### 11. Does startup mutate customer/master data?

**PASS**

Evidence: `initializeLoyaltyInfrastructure()` only creates collection/indexes. No `seedCustomers`. Bootstrap unchanged. Test asserts 0 customers after init.

---

### 12. Are unique constraints database-enforced?

**PASS**

Evidence: Schema `unique: true` on `phoneNormalized` and `publicMemberId`. Repository integration tests prove second insert rejects. API index inspection asserts `unique: true`.

---

## Additional Notes

| Topic | Status |
|-------|--------|
| Input size limits | Zod max phone 32, name 120 |
| Mongo injection | Query via FilterObject eq on normalized string; no raw `$where` |
| publicMemberId in logs | Not logged |
| registeredBy trust | From JWT `sub` only — not request body |

---

## Residual Risks (acceptable for V1 foundation)

| Risk | Severity | Mitigation / deferred |
|------|----------|----------------------|
| publicMemberId returned to authenticated cashiers | Low | Needed for future QR; not public yet |
| No rate limit on customer register | P2 | Login rate limit exists; add before public portal (LOYALTY-06) |
| Kasir can read any customer by UUID if known | Low | UUID unguessable; no list API |

---

## Verdict

**All 12 security questions: PASS**
