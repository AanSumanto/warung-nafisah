# Warung Nafisah ERP

Internal restaurant management system for **Warung Nafisah** — dual-shift warung (morning: Gendum Kuah Tetelan; evening: Pecel Lele, Ayam Penyet).

> **Architectural DNA:** Every business action creates a permanent business event.

## Phase Status

| Phase     | Scope                              | Status      |
| --------- | ---------------------------------- | ----------- |
| 0 / 0.5   | Requirements + Architecture Freeze | ✅ Approved |
| ADR-001   | Multi-Repository Strategy          | ✅ Approved |
| Sprint 1  | Backend Foundation (v0.5.1)        | ✅ Approved |
| Sprint 2  | Core Domain Framework (v0.6.0)     | ✅ Approved |
| Sprint 3A | Frontend Foundation (v0.7.0)       | ✅ Complete |

## Repository Structure

```
warung-nafisah/
├── backend/          # Express API (port 5000)
├── frontend/         # Next.js 15 app (port 3000)
├── deployment/       # Local infra: MongoDB + Redis (Docker)
├── scripts/          # Dev & verification scripts
├── reports/          # Architecture & sprint documentation
└── .github/workflows/
```

Per **ADR-001**, this monorepo is a transitional layout. Target state: separate `warung-nafisah-backend`, `warung-nafisah-frontend`, and `warung-nafisah-docs` repositories.

## Prerequisites

- Node.js **20+** (see `.nvmrc`)
- npm **10+**
- Docker & Docker Compose (optional, for local MongoDB + Redis)

## Quick Start

```bash
# Install dependencies
npm install

# Verify repository
npm run verify:repo

# Start local infrastructure (MongoDB + Redis)
docker compose -f deployment/docker-compose.yml up -d

# Backend API (port 5000) — separate terminal
npm run dev --workspace=@warung-nafisah/backend

# Frontend (port 3000) — separate terminal
npm run dev --workspace=@warung-nafisah/frontend
```

## Root Scripts

| Script                | Description               |
| --------------------- | ------------------------- |
| `npm run build`       | Build backend + frontend  |
| `npm run test`        | Run all workspace tests   |
| `npm run verify:repo` | Structure + format + lint |
| `npm run dev`         | Show dev server commands  |

## Workspaces

| Package                    | Purpose                                         |
| -------------------------- | ----------------------------------------------- |
| `@warung-nafisah/backend`  | Express API, domain framework, health endpoints |
| `@warung-nafisah/frontend` | Next.js UI shell, MUI theme, API client         |

## Documentation

Start at **[reports/README.md](reports/README.md)**.
