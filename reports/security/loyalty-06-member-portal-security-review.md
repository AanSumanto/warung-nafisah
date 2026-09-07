# LOYALTY-06 — Security Review

**Document ID:** WN-LOYALTY-06-SEC  
**Date:** 2026-09-07

## Evidence-based findings

| Control | Evidence |
|---------|----------|
| Token entropy | Unchanged LOYALTY-01: 24-byte base64url / 32 chars |
| Enumeration | Invalid format, unknown token, blocked → same `"Member tidak ditemukan"` 404 |
| No public search | No phone/name list endpoints; path token only |
| DTO allowlist | Integration asserts JSON absences: phoneNormalized, totalSpending, HPP, idempotencyKey, actor, customerId |
| Rate limit | Dedicated 60/min/IP on public GET; POS routes unaffected; skip in test |
| trust proxy | `app.set('trust proxy', 1)` — one hop; suitable for single reverse-proxy hop. **Gap if multi-proxy without correct hop count** |
| Cache | `Cache-Control: no-store` (+ Pragma) on public responses |
| Referrer | Portal metadata `referrer: no-referrer`; response `Referrer-Policy: no-referrer` |
| CORS | Existing origin allowlist — not `*` |
| Logging | pino req.url redacts `/public/rewards/member/[REDACTED]` |
| Frontend | Dedicated `fetch` (no apiClient 401→login); token not console.logged |
| Mutation | GET only; POST/PUT/etc → 405 |
| Rotation | Replacing `publicMemberId` invalidates old QR immediately |

## Residual risks

- Anyone with a printed QR can read current points until token rotated.
- In-memory rate limit does not share across API replicas.
- Referrer leakage mitigated but not eliminated for all browser edge cases.
