# LOYALTY-GO-LIVE-01 — Security Readiness

**Document ID:** WN-LOYALTY-GO-LIVE-01-SEC  
**Date:** 2026-09-09

## Scope

Public portal token privacy, rate limiting, trust proxy, cache, CORS/HTTPS, PII on receipts, admin RBAC. No production gate changes.

## Public member token

| Control | Status |
|---------|--------|
| Opaque `publicMemberId` in path `/rewards/member/:token` | Implemented |
| No `?phone=` / `?customerId=` / Mongo ID in portal URL builder | Implemented (`buildMemberPortalUrl`) |
| App logs redact `/public/rewards/member/*` token | Implemented (`app.ts` pino serializer) |
| Authorization header redacted | Implemented |
| Nginx/proxy access logs | **UNVERIFIED** — repo has no nginx config; default access logs often keep full URI → **document as residual risk** |

Preferred hardening (backlog): redact/suppress token-bearing URIs at reverse proxy.

## Rate limiting

| Layer | Config | Store | Topology note |
|-------|--------|-------|---------------|
| Global API | 100/min | in-memory | Single process |
| Public member | 60/min/IP | in-memory (`express-rate-limit`) | Separate from POS |
| POS login | separate limiter | in-memory | — |

**PM2:** `instances: 1`, `exec_mode: 'fork'` → in-memory limiter is **consistent for current documented topology**.

If production scales to cluster/multi-server: in-memory limiter is **not** globally consistent → classify **P1 hardening required** before scale; prefer Redis-backed limiter (Redis already in infra). **Do not casually replace during UAT.**

## Trust proxy

- Code: `app.set('trust proxy', 1)`
- Expected chain conceptually: Client → (CDN?) → Nginx? → Express
- **Hop count vs live deployment: UNVERIFIED**
- Incorrect trust proxy → wrong client IP → weak/abusable rate limits → **P1 go-live concern for IP security assumptions** until ops confirms hop count

Do not blindly change value.

## Cache

| Control | Status |
|---------|--------|
| Public API `Cache-Control: no-store` (+ Pragma, Referrer-Policy) | Implemented |
| Member page Next.js dynamic (`ƒ`) | Not static-prerendered with member data |
| CDN shared cache of token response | Must remain disabled; verify at deploy | Unverified live CDN |

## CORS / HTTPS

| Item | Finding |
|------|---------|
| `CORS_ORIGINS` | Explicit list; production validation rejects empty/unsafe patterns in env refine |
| Wildcard | Not required for loyalty; do not loosen |
| PUBLIC_APP_URL | HTTPS required outside localhost when building QR URLs |
| Frontend / backend HTTPS | Expected via reverse proxy / Vercel; verify at activation |

## RBAC / mutation surfaces

| Surface | Expectation | Evidence |
|---------|-------------|----------|
| Public portal | GET only; no mutation | Routes reject non-GET |
| Manual adjustment | Owner only; kasir 403 | LOYALTY-09 tests |
| Redemption | Cashier-controlled; gate env | LOYALTY-07 |
| Reversal | Internal service only; no public API | LOYALTY-08 |

## Privacy SOP reminders

- Phone = loyalty identity; not automatic WhatsApp marketing consent
- No marketing from this rollout without separate consent
- Cashier should not read full phone aloud unnecessarily
- Never print/log full public member token in reports

## Security readiness verdict

| Area | Verdict |
|------|---------|
| Application token handling | READY (code) |
| Proxy URI logging | **ACCEPTED RISK / VERIFY ON SERVER** |
| Rate limit (single instance) | ACCEPTABLE temporary |
| Rate limit (multi-instance) | NOT READY if scaled |
| Trust proxy hop | **VERIFY BEFORE RELYING ON IP LIMITS** |

Overall security track: **READY_WITH_ACCEPTED_RISKS** pending ops verification of proxy logs + trust hops. Does not alone clear full GO-LIVE without staging UAT.
