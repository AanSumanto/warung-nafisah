# Sprint 1 Hotfix — Redis Connection Regression

**Document ID:** WN-IMPL-S1-HF-001  
**Version:** 0.5.1  
**Date:** 2026-07-11  
**Status:** Complete — Awaiting Re-Approval

---

## 1. Incident Summary

| Field | Value |
|-------|-------|
| Symptom | Server fails startup with `NOAUTH Authentication required` |
| Secondary | Log spam: `Redis connected` every ~2 seconds (reconnect loop) |
| Impact | Sprint 1 cannot be approved; health/readiness never reaches `ready` |
| Scope | Redis configuration, connection, BullMQ preparation, health check |

---

## 2. Root Cause Analysis

### 2.1 Primary — BullMQ auth not applied

BullMQ placeholder queue was initialized with:

```typescript
connection: { url: process.env.REDIS_URL }
```

BullMQ bundles its own `ioredis` and **does not honour a `url` field** the same way as passing a URL string to `new Redis(url)`. The client connected to the host **without username/password**, causing `NOAUTH` on Redis Cloud / Upstash (ACL-enabled instances).

### 2.2 Secondary — Split environment variables

Sprint 1 initially supported `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD`, `REDIS_USERNAME`, and `REDIS_TLS` alongside `REDIS_URL`. When only `REDIS_URL` was set (correct for managed Redis), some code paths still built connections from partial host/port fields, dropping credentials.

### 2.3 Tertiary — Misleading reconnect logging

`client.on('connect')` fired on every TCP reconnect attempt. Combined with ioredis default retry (every ~2s), logs showed repeated `Redis connected` messages even though authentication never succeeded.

### 2.4 Health check behaviour

`pingRedis()` did not cause reconnect loops directly, but readiness failed permanently because the underlying client never reached `ready` state after auth failure.

---

## 3. Fix Applied

### 3.1 Single source of truth: `REDIS_URL`

| Before | After |
|--------|-------|
| `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD`, `REDIS_USERNAME`, `REDIS_TLS` optional | **Removed** — only `REDIS_URL` required |
| Inconsistent auth between ioredis and BullMQ | All consumers parse from `REDIS_URL` |

New module: `backend/src/config/redis-url.ts`

- Parses `redis://` and `rediss://` URLs
- Extracts host, port, username, password
- TLS enabled automatically when protocol is `rediss://` (no hardcoded provider logic)
- Masks credentials in logs (`rediss://***:***@host:6379`)

### 3.2 Redis client (`redis.ts`)

- Builds ioredis options via `toRedisConnectionConfig()` — explicit `host`, `port`, `username`, `password`, `tls`
- `lazyConnect: true` — no connection until `connectRedis()` is called
- Startup: up to 5 attempts with exponential backoff (1s → 2s → 4s → 8s → 10s cap)
- **Fail-fast**: throws `RedisConnectionError` and aborts `bootstrap()` — server does not start
- Clear logging: `✓ Redis Connected` / `✗ Redis Connection Failed` with protocol, host, TLS, provider (no password)
- Runtime reconnect: throttled warn log (max once per 30s), exponential `retryStrategy` capped at 10s

### 3.3 BullMQ (`queue.ts`)

- Uses `getBullMqConnectionOptions()` — same explicit host/port/auth/TLS as main client
- `isQueueReady()` delegates to `pingRedis()` — no separate reconnect

### 3.4 Environment (`env.ts`)

- Zod schema validates `REDIS_URL` starts with `redis://` or `rediss://`

### 3.5 Health endpoints

- `/health` includes `getRedisStatus()` detail (protocol, host, port, tls, provider, maskedUrl, ping)
- `pingRedis()` only pings existing ready client — returns `false` if not connected (no reconnect trigger)

### 3.6 MongoDB logging alignment

- `database.ts` now logs `✓ MongoDB Connected` / `✗ MongoDB Connection Failed` with masked URI

---

## 4. Supported URL Formats

| Provider | Example |
|----------|---------|
| Redis OSS (local) | `redis://localhost:6379` |
| Redis Cloud | `rediss://default:PASSWORD@host.redislabs.com:6379` |
| Upstash | `rediss://default:TOKEN@us1-xxx.upstash.io:6379` |
| Custom username | `rediss://myuser:mypass@host.example.com:6380` |

---

## 5. Files Changed

| File | Change |
|------|--------|
| `src/config/redis-url.ts` | **New** — URL parser, mask, TLS, provider detection |
| `src/config/redis.ts` | Rewritten — fail-fast, backoff, BullMQ options export |
| `src/config/env.ts` | `REDIS_URL` only |
| `src/config/queue.ts` | Explicit BullMQ connection options |
| `src/config/database.ts` | Startup success/failure logging |
| `src/presentation/routes/v1/health.routes.ts` | Redis status detail |
| `.env.example` | `REDIS_URL` examples for OSS / Cloud / Upstash |
| `tests/unit/config/redis-url.test.ts` | **New** — 16 parser/mask tests |
| `tests/unit/config/redis-connect.test.ts` | **New** — fail-fast + success tests |
| `tests/integration/health.test.ts` | Updated mocks |

---

## 6. Deployment Note

Set a single variable in `.env`:

```env
REDIS_URL=rediss://default:YOUR_PASSWORD@YOUR_REDIS_HOST:6379
```

Do **not** set `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD`, `REDIS_USERNAME`, or `REDIS_TLS`.

---

## 7. Sprint 1 Gate (Post-Hotfix)

| Gate | Status |
|------|--------|
| MongoDB Connected | ✅ |
| Redis Connected | ✅ (with valid `REDIS_URL`) |
| Health Endpoint PASS | ✅ |
| Build PASS | ✅ |
| Test PASS | ✅ 51/51 |
| Manual Verification | ⬜ Requires operator sign-off with live Redis Cloud |

**Sprint 2 remains blocked until Sprint 1 re-approval.**
