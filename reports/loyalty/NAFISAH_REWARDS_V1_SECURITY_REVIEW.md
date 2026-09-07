# Nafisah Rewards V1 — Security Review

**Document ID:** WN-LOYALTY-SEC-001  
**Date:** 2026-09-01  
**Status:** PRE-IMPLEMENTATION REVIEW

---

## 1. Scope

Security and privacy assessment for Nafisah Rewards V1 integration into production Warung Nafisah ERP, covering phone PII, public portal, QR tokens, RBAC, API exposure, and existing infrastructure.

---

## 2. Findings Summary

| ID | Finding | Severity |
|----|---------|----------|
| SEC-001 | No public member token pattern exists | P1 |
| SEC-002 | No public API rate limiting (except login) | P1 |
| SEC-003 | Order UUIDs used directly in authenticated API paths | P2 |
| SEC-004 | Feature flags not enforced server-side | P1 |
| SEC-005 | RBAC matrix frozen but only owner/kasir implemented | P2 |
| SEC-006 | JWT default dev secret in env fallback | P2 |
| SEC-007 | Audit timeline in-memory only — not persisted | P2 |
| SEC-008 | No phone normalization or PII masking utilities | P1 |
| SEC-009 | CORS configured but unchanged — adequate for V1 | P3 |
| SEC-010 | No CSRF tokens — JWT bearer API (acceptable) | P3 |
| SEC-011 | Sequential order numbers enumerable with auth | P3 |
| SEC-012 | Menu startup patches mutate production data | P1 |

---

## 3. Detailed Findings

### SEC-001 — No public member token pattern

| Attribute | Detail |
|-----------|--------|
| **Finding** | Codebase uses UUID v4 for entities; no `publicMemberId`, `publicId`, or opaque token layer |
| **Evidence** | Grep: no matches for `publicId`/`publicMemberId` in `backend/src`; orders use `crypto.randomUUID()` |
| **Current behavior** | All IDs are internal UUIDs or prefixed deterministic seed IDs |
| **Risk** | Exposing MongoDB `_id` or phone in QR enables correlation and enumeration |
| **Recommended architecture** | Generate `publicMemberId` = 128-bit+ entropy (e.g. 32-byte base64url); separate from `_id`; support rotation/revocation |
| **Implementation impact** | New field on Customer; portal route uses token only |
| **Severity** | **P1** |

---

### SEC-002 — No public endpoint rate limiting

| Attribute | Detail |
|-----------|--------|
| **Finding** | Only login endpoint has rate limit |
| **Evidence** | `backend/src/presentation/routes/v1/pos.routes.ts` lines 69–82 — `loginRateLimit` only |
| **Current behavior** | Authenticated POS routes unlimited |
| **Risk** | Public portal token brute-force / scraping |
| **Recommended architecture** | `express-rate-limit` on `/api/v1/public/rewards/*`: 60/min IP, 30/min token; exponential backoff on 404 |
| **Implementation impact** | New middleware on public routes |
| **Severity** | **P1** |

---

### SEC-003 — Order UUID in API paths (IDOR surface)

| Attribute | Detail |
|-----------|--------|
| **Finding** | `/orders/:orderId` uses raw UUID |
| **Evidence** | `pos.routes.ts`; `assertOrderAccess()` enforces cashier ownership |
| **Current behavior** | Kasir sees own orders; owner sees all |
| **Risk** | BOLA if access check bypassed; UUID guess impractical but no defense-in-depth |
| **Recommended architecture** | Keep UUID + strict RBAC; loyalty endpoints same pattern |
| **Severity** | **P2** |

---

### SEC-004 — Feature flags documented but not implemented

| Attribute | Detail |
|-----------|--------|
| **Finding** | `loyalty.enabled` in frozen docs; no runtime evaluation |
| **Evidence** | `reports/security/03-feature-flags.md`; no code in `backend/src` |
| **Risk** | Frontend-only hiding allows API abuse if loyalty routes deployed early |
| **Recommended architecture** | `loyalty_program.enabled` check in every loyalty code path; return 403 FEATURE_DISABLED |
| **Severity** | **P1** |

---

### SEC-005 — RBAC partially implemented

| Attribute | Detail |
|-----------|--------|
| **Finding** | Frozen matrix defines 12 roles; code has `owner` and `kasir` only |
| **Evidence** | `backend/src/domain/pos/PosTypes.ts` — `UserRole = 'owner' | 'kasir'` |
| **Current behavior** | `requireRole('owner')` for admin menu ops |
| **Risk** | Manual point adjustment permissions undefined in code |
| **Recommended architecture** | V1: `owner` only for manual adjustment; `kasir` for lookup/register/redeem |
| **Severity** | **P2** |

---

### SEC-006 — JWT secret fallback

| Attribute | Detail |
|-----------|--------|
| **Finding** | Dev JWT secret used if env not set |
| **Evidence** | `backend/src/config/env.ts` |
| **Risk** | Production misconfiguration → token forgery |
| **Recommended architecture** | Verify production uses strong `JWT_SECRET` (operational check, not code change in 28A) |
| **Severity** | **P2** |

---

### SEC-007 — Audit timeline not persisted

| Attribute | Detail |
|-----------|--------|
| **Finding** | `AuditTimelineProjection` stores entries in memory |
| **Evidence** | `backend/src/application/events/AuditTimelineProjection.ts` |
| **Risk** | Loyalty audit lost on restart; compliance gap |
| **Recommended architecture** | Persist loyalty mutations to `loyalty_ledger` (immutable); optional future `audit_logs` collection |
| **Severity** | **P2** (mitigated by ledger design) |

---

### SEC-008 — Phone PII handling absent

| Attribute | Detail |
|-----------|--------|
| **Finding** | No customer phone fields exist yet |
| **Evidence** | No Customer entity |
| **Risk** | Future implementation may log/store full phones in URLs, logs, receipts |
| **Recommended architecture** | `phoneNormalized` internal only; `phoneMasked` for display; never log full phone at info level; mask in receipt |
| **Severity** | **P1** |

---

### SEC-009 — CORS configuration

| Attribute | Detail |
|-----------|--------|
| **Finding** | CORS from env `CORS_ORIGINS` |
| **Evidence** | `backend/src/presentation/middleware/cors.middleware.ts` |
| **Current behavior** | Explicit origin allowlist |
| **Risk** | Low for loyalty if public portal same-origin via Next.js |
| **Recommended architecture** | Public API CORS: restrict to frontend domain; no `*` |
| **Severity** | **P3** |

---

### SEC-010 — CSRF

| Attribute | Detail |
|-----------|--------|
| **Finding** | Stateless JWT API — no cookie session |
| **Evidence** | Bearer token in Authorization header |
| **Risk** | Low for API; public GET portal read-only |
| **Severity** | **P3** |

---

### SEC-011 — Sequential order numbers

| Attribute | Detail |
|-----------|--------|
| **Finding** | `WN-YYYYMMDD-NNNNNN` daily sequence |
| **Evidence** | `MongoOrderNumberGenerator` |
| **Risk** | Enumerable but requires authentication |
| **Recommended architecture** | Do not reuse order number pattern for member tokens |
| **Severity** | **P3** |

---

### SEC-012 — Startup menu mutation

| Attribute | Detail |
|-----------|--------|
| **Finding** | `applyMenuCatalogPatches()` runs every boot |
| **Evidence** | `runDatabaseBootstrap.ts:24`, `seedPosData.ts:204` |
| **Risk** | Unintended production data mutation; violates "startup must not mutate master data" principle |
| **Recommended architecture** | Move patches to one-time migration; remove from startup before loyalty go-live |
| **Severity** | **P1** |

---

## 4. Public Portal Threat Model

| Threat | Control |
|--------|---------|
| Token enumeration | High-entropy token (≥128 bits); uniform 404 for invalid/expired |
| Token leakage via QR photo | Token is designed to be scanned — rate limit; no sensitive data in response |
| Scraping member list | No list endpoint; token required |
| Direct redemption from portal | No write endpoints on public API |
| XSS on portal | React SSR escape; CSP headers |
| IDOR via token | Token maps to exactly one customer; no cross-token data |

---

## 5. QR Security Requirements

**QR must NOT contain:**
- Raw phone number
- MongoDB ObjectId
- Sequential identifier
- JWT or session token

**QR must contain:**
- HTTPS URL with `publicMemberId` only

**Token lifecycle:**
- Rotation: increment `publicMemberIdVersion`, revoke old
- Revocation: set customer status `blocked` or token status `revoked`
- Lookup: index on `publicMemberId` where status active

---

## 6. Cashier RBAC for Loyalty (Proposed)

| Action | owner | kasir |
|--------|-------|-------|
| Member lookup by phone | ✅ | ✅ |
| Quick register | ✅ | ✅ |
| View member points | ✅ | ✅ |
| Redeem reward | ✅ | ✅ |
| Manual point adjustment | ✅ | ❌ |
| Edit reward catalog | ✅ | ❌ |
| Enable/disable loyalty | ✅ | ❌ |
| View full phone (admin) | ✅ | ❌ (masked only) |

---

## 7. Logging & PII Policy (Proposed)

| Data | Log level | Storage |
|------|-----------|---------|
| Full phone | ❌ Never info/debug | `customers.phoneNormalized` only |
| Masked phone | ✅ OK | Display |
| publicMemberId | ✅ OK (truncated) | customers |
| Points delta | ✅ OK | loyalty_ledger |
| Ledger idempotencyKey | ✅ OK | loyalty_ledger |

---

## 8. Security Test Cases (Future)

1. Public token cannot enumerate customers (404 uniform)
2. Portal cannot redeem points (no POST/PUT public)
3. Invalid token rate limited
4. Kasir cannot access manual adjustment API
5. Full phone never in public API response
6. QR URL contains no phone or ObjectId
7. Duplicate phone registration blocked
8. Revoked token returns 404
9. Cross-customer IDOR blocked on loyalty APIs
10. `loyalty.enabled=false` returns 403 on all loyalty mutations

---

## 9. Production Blockers (Security)

| Blocker | Must resolve before |
|---------|---------------------|
| SEC-001 Public token design | Portal go-live |
| SEC-002 Rate limiting | Portal go-live |
| SEC-004 Backend feature gate | Any loyalty activation |
| SEC-008 Phone masking utilities | Customer sprint |
| SEC-012 Menu startup patches | General production hygiene |

---

*End of Security Review*
