# CORS Configuration

**Status:** Implemented — Sprint production hardening  
**Owner:** Backend API  
**Related:** `backend/src/config/cors.ts`, `backend/src/config/cors-origins.ts`

---

## Overview

Cross-Origin Resource Sharing (CORS) controls which browser origins may call the Warung Nafisah API with credentials (cookies / `Authorization` header).

The API uses an **explicit allowlist** — never `*`.

---

## Environment variable

| Variable | Format | Example |
|----------|--------|---------|
| `CORS_ORIGINS` | Comma-separated absolute origins | `https://warung-nafisah.vercel.app,https://preview.example.vercel.app` |

### Rules

- Each entry must be a full origin: `scheme://host[:port]`
- No trailing path (`/login`), query, hash, or wildcard (`*`)
- No userinfo (`user:pass@`)
- Duplicates are removed automatically
- Whitespace around commas is trimmed

### Development default

```
CORS_ORIGINS=http://localhost:3000
```

### Production example (Nevacloud)

```
NODE_ENV=production
CORS_ORIGINS=https://warung-nafisah.vercel.app
```

Multiple frontends:

```
CORS_ORIGINS=https://warung-nafisah.vercel.app,https://admin.warungnafisah.com
```

### Production validation (startup)

When `NODE_ENV=production`:

- At least one origin required
- All origins must use `https://`
- `localhost` / `127.0.0.1` are rejected

---

## Request flow

```
Browser request with Origin header
        │
        ▼
┌───────────────────────┐
│  corsOriginGuard      │  Origin not in allowlist → 403 CORS_001
└───────────┬───────────┘
            │ allowed
            ▼
┌───────────────────────┐
│  cors middleware      │  Sets Access-Control-* headers
└───────────┬───────────┘
            ▼
       API handlers
```

### Responses

| Case | HTTP | Body |
|------|------|------|
| Allowed origin | 200 / 204 (preflight) | Normal API response + CORS headers |
| Disallowed origin | **403** | `{ success: false, error: { code: "CORS_001", ... } }` |
| No `Origin` header | 200 | Server-to-server / curl — no CORS applied |

**Important:** The `cors` package must never receive `callback(Error)` — that causes HTTP 500. Rejected origins are handled by the guard middleware.

---

## Credentials

`credentials: true` is enabled. The server reflects the **exact** allowed origin in `Access-Control-Allow-Origin` (never `*`).

Supported methods: `GET`, `POST`, `PUT`, `PATCH`, `DELETE`, `OPTIONS`

Allowed headers:

- `Content-Type`
- `Authorization`
- `X-Request-Id`
- `X-Correlation-Id`
- `X-API-Version`

---

## Logging

| Event | Level | Fields |
|-------|-------|--------|
| Startup allowlist loaded | `info` | `originCount`, `origins` (hostnames only) |
| Origin rejected | `warn` | `event: cors_rejected`, `originHost`, `method`, `path` |

Full origin URLs are logged only as hostnames on startup. Rejected requests log `originHost` — no tokens or credentials.

---

## Vercel + HTTP backend note

If the frontend uses **API proxy** (`API_PROXY_TARGET` on Vercel), browser requests may not send `Origin` to the backend directly — Vercel server proxies server-side. CORS is still required when:

- Frontend calls the API directly (`NEXT_PUBLIC_API_BASE_URL` set)
- Mobile apps or third-party clients call the API

---

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| `Origin tidak diizinkan` (403) | Add exact frontend URL to `CORS_ORIGINS` on Nevacloud `.env` |
| Still blocked after `.env` change | `npm run pm2:restart` |
| Works locally, fails in production | Ensure production origin uses `https://` and matches Vercel URL exactly |
| Preview deployments | Add each preview URL, e.g. `https://warung-nafisah-git-branch-user.vercel.app` |

---

## Tests

| File | Coverage |
|------|----------|
| `tests/unit/config/cors.test.ts` | Parsing, normalization, allowlist |
| `tests/integration/cors.test.ts` | localhost + Vercel origin, 403 regression |

Run:

```bash
npm run test --workspace=@warung-nafisah/backend -- tests/unit/config/cors.test.ts tests/integration/cors.test.ts
```
