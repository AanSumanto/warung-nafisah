# Warung Nafisah ERP — Backend API

Sprint 1 foundation — Express API with MongoDB (host) and Redis Cloud. **No business modules.**

## Prerequisites

- Node.js 20+
- MongoDB (existing host database)
- Redis Cloud account

## Setup

```bash
cd backend
cp .env.example .env
# Edit .env — set MONGODB_URI and REDIS_URL (Redis Cloud)
npm install
```

## Run

```bash
npm run dev
```

Server starts at **http://localhost:5000**

## Health Endpoints

| Endpoint | Purpose |
|----------|---------|
| `GET /api/v1/health/live` | Liveness |
| `GET /api/v1/health/ready` | Readiness (MongoDB + Redis + BullMQ) |
| `GET /api/v1/health/health` | Detailed status |

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Development server (tsx watch) |
| `npm run build` | Compile TypeScript |
| `npm start` | Run compiled `dist/server.js` |
| `npm test` | Vitest |
| `npm run lint` | ESLint |

## Environment Variables

See `.env.example`. Required:

- `MONGODB_URI` — host database connection string
- `MONGODB_DB_NAME` — database name
- `REDIS_URL` — Redis Cloud URL (`rediss://...`) **or** `REDIS_HOST` + credentials

## Architecture

Clean Architecture folder structure per `warung-nafisah-docs/reports/architecture/21-folder-structure-final.md`.

Sprint 1 foundation + Sprint 2 core domain framework. **No business modules.**

## Framework Layers (Sprint 2)

| Layer | Path | Contents |
|-------|------|----------|
| Domain | `src/domain/` | Entity, Aggregate, VO, Money, Result, Either |
| Application | `src/application/` | UseCase, CQRS interfaces, DTO, Pagination |
| Core | `src/core/persistence/` | Repository & UoW interfaces |
| Shared | `src/shared/` | GenericResponse, GenericPage |

## Scripts

`SIGTERM` / `SIGINT` closes HTTP server, BullMQ, Redis, and MongoDB connections in order.
