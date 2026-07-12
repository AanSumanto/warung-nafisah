# Development Setup — Multi-Repository

**Document ID:** WN-DEV-001  
**Version:** 1.0.0 (ADR-001)  
**Status:** FROZEN

---

## 1. Prerequisites

| Tool | Version | Used By |
|------|---------|---------|
| Node.js | 20+ | Backend, Frontend |
| npm | 10+ | Backend, Frontend |
| Docker & Compose | Latest | Backend only |
| Git | Latest | All repos |
| Vercel CLI | Optional | Frontend deploy preview |

---

## 2. Clone Repositories

```bash
git clone git@github.com:soemanto/warung-nafisah-docs.git
git clone git@github.com:soemanto/warung-nafisah-backend.git
git clone git@github.com:soemanto/warung-nafisah-frontend.git
```

**Recommended layout** (sibling directories):

```
~/soemanto/
├── warung-nafisah-docs/
├── warung-nafisah-backend/
└── warung-nafisah-frontend/
```

---

## 3. Backend Setup

```bash
cd warung-nafisah-backend
cp .env.example .env
docker compose up -d mongodb redis
npm install
npm run dev          # http://localhost:5000
```

Verify: `GET http://localhost:5000/api/v1/health/live` (after Phase 1.2 scaffold)

---

## 4. Frontend Setup

```bash
cd warung-nafisah-frontend
cp .env.example .env.local
npm install
npm run codegen      # Generate types from openapi/openapi.yaml
npm run dev          # http://localhost:3000
```

`.env.local`:

```
NEXT_PUBLIC_API_URL=http://localhost:5000
```

---

## 5. OpenAPI Contract Workflow

1. Backend team updates `openapi/openapi.yaml`
2. Backend CI validates spec + runs contract tests
3. Frontend copies or fetches spec (CI artifact / pinned release)
4. Frontend runs `npm run codegen` → `src/types/api/`
5. Frontend CI validates generated types compile

---

## 6. Documentation

All architecture docs live in **`warung-nafisah-docs`**.

Start at: `reports/architecture/00-phase0.5-freeze-report.md`

---

## 7. Common Commands

| Task | Command | Repo |
|------|---------|------|
| Start infra | `docker compose up -d` | backend |
| API dev server | `npm run dev` | backend |
| BullMQ worker | `npm run worker` | backend |
| UI dev server | `npm run dev` | frontend |
| Run all tests | `npm test` | each repo |
| Lint | `npm run lint` | each repo |

---

## 8. Related

- [ADR-001](../architecture/ADR-001-multi-repository-strategy.md)
- [Deployment Architecture](../architecture/23-deployment-architecture.md)
- [CI/CD Strategy](./07-cicd-strategy.md)
