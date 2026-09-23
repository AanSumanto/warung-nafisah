# LOYALTY-GO-LIVE-02 — Proxy / Logging Security

**Document ID:** WN-LOYALTY-GO-LIVE-02-SEC-PROXY  
**Date:** 2026-09-09

## Status summary

| Control | Status |
|---------|--------|
| **TRUST_PROXY_STATUS** | **UNVERIFIED** |
| **NGINX_MEMBER_TOKEN_LOGGING** | **UNVERIFIED** |
| App token path redaction (code) | Implemented |
| Staging app-log proof (live) | **BLOCKED_MANUAL** |
| Cache-Control no-store (code) | Implemented |
| Live CORS/HTTPS proof | **BLOCKED_MANUAL** |

## Trust proxy

**Code:** `app.set('trust proxy', 1)` in `backend/src/app.ts`.

**Documented conceptual chain (architecture):**

```
Client → Vercel (FE) / Client → Nginx (API) → Express
```

For API traffic only: Client → Nginx → Express ≈ **1 hop** *if* no CDN/extra proxy sits in front of Nginx.

**Agent could not:**

- SSH to Nevacloud/VPS
- Read live Nginx config
- Inspect live `X-Forwarded-For` hop count

Therefore: **UNVERIFIED** (not VERIFIED_CORRECT).

### Operator verification

On API VPS:

```bash
# Inspect nginx site config (paths may differ)
sudo nginx -T | grep -nE 'proxy_set_header|real_ip|set_real_ip|listen|server_name'
# Confirm whether Cloudflare/CDN terminates TLS before Nginx
```

| Observed chain | Expected `trust proxy` |
|----------------|------------------------|
| Client → Nginx → Express | `1` likely correct |
| Client → CDN → Nginx → Express | often `2` (or CDN-aware config) |

If hop count wrong → **P1 BLOCKER** for IP rate-limit security assumptions. Do not blindly change without measuring.

## Nginx member token logging

Member capability token appears in:

- FE: `/rewards/member/<token>`
- API: `/api/v1/public/rewards/member/<token>` (path shape per routes)

**Repo:** no checked-in live Nginx access_log config.

Default Nginx `$request_uri` / `$uri` logging typically **stores full path including token** → classify risk as **TOKEN_LOGGED** until proven otherwise.

### Operator check

```bash
sudo nginx -T | grep -nE 'access_log|log_format'
# Sample recent access log lines for member routes (redact tokens before sharing)
sudo grep -E 'rewards/member' /var/log/nginx/access.log | tail -n 5
```

| Finding | Classification |
|---------|----------------|
| Full URI with token present | **TOKEN_LOGGED** (privacy residual risk) |
| Redacted/suppressed for member routes | **SAFE** |
| Cannot inspect | **UNVERIFIED** |

### Preferred mitigations (plan only — do not implement in this sprint unless P0)

1. Custom `log_format` that replaces member token segment with `[REDACTED]`  
2. Separate `access_log off` / dedicated location with reduced logging for token routes  
3. Keep app-level redaction (already present) — insufficient alone if proxy logs full URI

Do **not** disable all useful logging globally.

## App logging

**Code:** pino HTTP serializer redacts `/public/rewards/member/*` token segment to `[REDACTED]`.

### Staging proof (operator)

1. On staging API, request invalid token:  
   `GET /api/v1/public/rewards/member/not-a-real-token`  
2. Expect generic 404.  
3. Inspect PM2/app logs: full token must **not** appear.  
4. Paste only redacted log excerpt into evidence.

**This agent:** **BLOCKED_MANUAL** (no confirmed staging + no log access).

## Cache / HTTPS / CORS

| Item | Code / docs | Live |
|------|-------------|------|
| Public API `Cache-Control: no-store` | Yes | BLOCKED_MANUAL to confirm staging headers |
| Member page dynamic | Next `ƒ` route | — |
| `PUBLIC_APP_URL` HTTPS outside localhost | Enforced in URL builder | Set on staging before QR |
| CORS explicit origins | Env + production refine | Confirm no `*` |

## Security response tests (staging operator)

| Case | Expected |
|------|----------|
| Malformed token | Generic 404 |
| Unknown token | Generic 404 |
| Blocked member | Generic 404 |
| Flood | 429 |
| Public mutation | 405 |
| Kasir manual adjustment | 403 |

## Verdict

Proxy/logging track remains open. Treat **UNVERIFIED** trust proxy + **UNVERIFIED** nginx token logging as **P1 closure items** before relying on IP rate limits / claiming token privacy complete in production.
