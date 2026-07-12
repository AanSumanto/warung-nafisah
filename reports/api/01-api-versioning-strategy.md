# API Versioning Strategy — Architecture Freeze

**Document ID:** WN-API-001  
**Version:** 1.1.0 (ADR-001)  
**Status:** FROZEN

---

## 1. Current Version

All endpoints: **`/api/v1`**

```
https://api.warungnafisah.id/api/v1/orders
https://api.warungnafisah.id/api/v1/queries/dashboard/today
```

Development:

```
http://localhost:5000/api/v1/...
```

---

## 2. Route Structure (Frozen)

```
/api/v1/
├── auth/
├── commands/          # POST — write operations (CQRS)
├── queries/           # GET — read model queries only
├── webhooks/          # Inbound integrations
├── sync/              # Offline POS sync
├── health/            # Liveness, readiness
├── admin/             # Replay, dead letter (Owner)
└── analytics/         # Event export (feature-flagged)
```

---

## 3. Shared Contract (ADR-001)

Frontend (`warung-nafisah-frontend`) and Backend (`warung-nafisah-backend`) are **separate repositories**.

| Mechanism | Owner | Location |
|-----------|-------|----------|
| OpenAPI 3.0 spec | Backend | `warung-nafisah-backend/openapi/openapi.yaml` |
| REST endpoints | Backend | `/api/v1/*` |
| Typed DTO (generated) | Frontend | `src/types/api/` via openapi-typescript |
| Error codes | Docs + OpenAPI | `warung-nafisah-docs/reports/api/02-error-code-catalog.md` |

**No shared npm package between repositories.**

---

## 4. Version Headers

| Header | Purpose |
|--------|---------|
| `X-API-Version` | Response includes `1` |
| `Sunset` | Deprecation date (RFC 8594) when applicable |
| `X-Request-Id` | Correlation — stored in event metadata |

---

## 5. Command / Query Separation

| Type | Method | Path Pattern | Reads |
|------|--------|--------------|-------|
| Command | POST | `/api/v1/commands/{action}` | Nothing (write) |
| Query | GET | `/api/v1/queries/{resource}` | Read Models only |

**Examples:**

- `POST /api/v1/commands/complete-sale`
- `GET /api/v1/queries/dashboard/today?outletId=...`
- `GET /api/v1/queries/pos/menu?outletId=...`

---

## 6. v2 Strategy (Future)

| Trigger for v2 | Action |
|----------------|--------|
| Breaking request/response shape | New route `/api/v2` |
| Non-breaking addition | Stay on v1 |
| Deprecation | `Sunset` header on v1 endpoint |

### Coexistence Rules

| Rule | Detail |
|------|--------|
| v1 supported | Minimum 12 months after v2 launch |
| Shared backend | Same command handlers; different DTO mappers |
| Event store | Version-agnostic — events never change |
| Read models | v1 and v2 may read same projections |
| OpenAPI | Separate `openapi-v2.yaml` or versioned paths in spec |

---

## 7. Related

- [ADR-001](../architecture/ADR-001-multi-repository-strategy.md)
- [02-error-code-catalog.md](./02-error-code-catalog.md)
- [16-read-model-strategy.md](../architecture/16-read-model-strategy.md)
- [07-cicd-strategy.md](../implementation/07-cicd-strategy.md)
