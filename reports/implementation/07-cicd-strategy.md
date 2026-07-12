# CI/CD Strategy — Multi-Repository

**Document ID:** WN-CICD-001  
**Version:** 1.0.0 (ADR-001)  
**Status:** FROZEN

---

## 1. Overview

Each repository has an **independent CI/CD pipeline** aligned with Soemanto deployment standard.

| Repository | CI | CD Target |
|------------|-----|-----------|
| `warung-nafisah-frontend` | GitHub Actions | **Vercel** (auto) |
| `warung-nafisah-backend` | GitHub Actions | **Bettazon VPS** (Docker) |
| `warung-nafisah-docs` | GitHub Actions | None (validation only) |

---

## 2. Frontend Pipeline

**File:** `warung-nafisah-frontend/.github/workflows/ci.yml`

### On Pull Request

```
checkout → setup node → npm ci
  → lint
  → typecheck
  → openapi codegen (from pinned spec)
  → build (next build)
  → contract test (optional: schemathesis / openapi-validator)
```

### On Push to `main`

```
GitHub Actions (above) ──► Vercel Git Integration
                              └── Production deploy
```

**No Docker build. No VPS deploy.**

### Vercel Configuration

| Setting | Value |
|---------|-------|
| Framework | Next.js |
| Build command | `npm run build` |
| Output | `.next` |
| Env `NEXT_PUBLIC_API_URL` | `https://api.warungnafisah.id` |

---

## 3. Backend Pipeline

**File:** `warung-nafisah-backend/.github/workflows/ci.yml`

### On Pull Request

```
checkout → setup node → npm ci
  → lint
  → test (with MongoDB + Redis service containers)
  → build (tsc)
  → validate openapi.yaml
  → docker build (no push)
```

### On Push to `main`

```
checkout → test → docker build
  → push image to registry (ghcr.io/soemanto/warung-nafisah-backend)
  → SSH deploy to Bettazon VPS
      └── docker compose -f docker-compose.prod.yml pull && up -d
```

### Service Containers (CI)

```yaml
services:
  mongodb:
    image: mongo:7
    ports: ['27017:27017']
  redis:
    image: redis:7-alpine
    ports: ['6379:6379']
```

---

## 4. Docs Pipeline

**File:** `warung-nafisah-docs/.github/workflows/ci.yml`

```
checkout → validate folder structure
         → markdown link check
         → no broken internal references
```

Optional: GitHub Pages for rendered documentation.

---

## 5. OpenAPI Contract Enforcement

| Check | Where | When |
|-------|-------|------|
| OpenAPI spec valid | Backend CI | Every PR |
| Endpoints match spec | Backend contract tests | Every PR |
| Frontend types match spec | Frontend CI codegen + compile | Every PR |
| Spec version pinned | Frontend `openapi/openapi.yaml` hash or release tag | Every PR |

Breaking API changes require:

1. Version bump discussion
2. Updated OpenAPI
3. Coordinated frontend PR (or backward-compatible v1 extension)

---

## 6. Secrets Management

| Secret | Repository | Usage |
|--------|------------|-------|
| `VERCEL_TOKEN` | frontend (optional if Git integration) | Deploy |
| `VPS_SSH_KEY` | backend | Deploy to Bettazon |
| `GHCR_TOKEN` | backend | Push Docker image |
| `MONGODB_URI` | backend (VPS env) | Production DB |
| `JWT_SECRET` | backend (VPS env) | Auth |

**Never** store secrets in `warung-nafisah-docs`.

---

## 7. Rollback

| Component | Strategy |
|-----------|----------|
| Frontend | Vercel instant rollback to previous deployment |
| Backend | `docker compose` pull previous image tag + restart |
| Database | Point-in-time restore from backup (see deployment doc) |

---

## 8. Related

- [ADR-001](../architecture/ADR-001-multi-repository-strategy.md)
- [Deployment Architecture](../architecture/23-deployment-architecture.md)
- [Development Setup](./06-development-setup.md)
