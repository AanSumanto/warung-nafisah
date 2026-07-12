# Deployment Architecture

**Document ID:** WN-DEPLOY-001  
**Version:** 1.0.0 (ADR-001)  
**Status:** FROZEN  
**Related:** [ADR-001-multi-repository-strategy.md](./ADR-001-multi-repository-strategy.md)

---

## 1. Overview

Warung Nafisah ERP deploys as **three independent repositories** with **two deployment targets**:

| Component | Repository | Target |
|-----------|------------|--------|
| Frontend | `warung-nafisah-frontend` | Vercel |
| Backend API + Workers | `warung-nafisah-backend` | Bettazon VPS (Docker) |
| Documentation | `warung-nafisah-docs` | GitHub |

---

## 2. Development Environment

### Ports (Frozen — ADR-001)

| Service | URL | Repository |
|---------|-----|------------|
| Frontend | `http://localhost:3000` | `warung-nafisah-frontend` |
| Backend API | `http://localhost:5000` | `warung-nafisah-backend` |
| MongoDB | `mongodb://localhost:27017` | backend `docker-compose.yml` |
| Redis | `redis://localhost:6379` | backend `docker-compose.yml` |

### Startup Order

```bash
# Terminal 1 — Backend infrastructure
cd warung-nafisah-backend
docker compose up -d mongodb redis
npm run dev                    # Express on :5000

# Terminal 2 — BullMQ worker (when implemented)
cd warung-nafisah-backend
npm run worker

# Terminal 3 — Frontend
cd warung-nafisah-frontend
npm run dev                    # Next.js on :3000
```

### Environment Variables

**Frontend** (`.env.local`):

```
NEXT_PUBLIC_API_URL=http://localhost:5000
```

**Backend** (`.env`):

```
PORT=5000
MONGODB_URI=mongodb://localhost:27017
MONGODB_DB_NAME=warung_nafisah
REDIS_HOST=localhost
REDIS_PORT=6379
CORS_ORIGINS=http://localhost:3000
```

---

## 3. Production Environment

### DNS & Routing

| Host | Target | Purpose |
|------|--------|---------|
| `app.warungnafisah.id` | Vercel | Frontend (Next.js) |
| `api.warungnafisah.id` | VPS (Nginx → Express) | Backend REST API |

### Production Flow

```
User Browser
     │
     ▼
┌──────────────┐
│   Vercel     │  Static + SSR (Next.js)
│  Frontend    │  env: NEXT_PUBLIC_API_URL=https://api.warungnafisah.id
└──────┬───────┘
       │ HTTPS /api/v1/*
       ▼
┌──────────────┐
│ Bettazon VPS │
│  ┌────────┐  │
│  │ Nginx  │  │  TLS termination, rate limit
│  └───┬────┘  │
│      ▼       │
│  ┌────────┐  │
│  │ Express│  │  :5000 internal
│  └───┬────┘  │
│      │       │
│  ┌───┴───┐   │
│  ▼       ▼   │
│ MongoDB Redis│
│      │       │
│  ┌───▼───┐   │
│  │BullMQ │   │  Async event handlers, notifications
│  │Worker │   │
│  └───────┘   │
└──────────────┘
```

---

## 4. Docker Services (Backend Repo Only)

| Service | Image | Purpose |
|---------|-------|---------|
| `api` | Custom Dockerfile | Express application |
| `worker` | Same image, different CMD | BullMQ consumer |
| `mongodb` | `mongo:7` | Primary database |
| `redis` | `redis:7-alpine` | Cache + BullMQ broker |
| `nginx` | `nginx:alpine` | Reverse proxy (production compose) |

**Frontend has no Docker services.**

---

## 5. Deployment Commands

### Backend (VPS)

```bash
# On Bettazon VPS
cd /opt/warung-nafisah-backend
git pull origin main
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d
```

### Frontend (Vercel)

Automatic on `git push` to `main`. Manual promote via Vercel dashboard for rollbacks.

---

## 6. Health Checks

| Endpoint | Purpose | Consumer |
|----------|---------|----------|
| `GET /api/v1/health/live` | Process alive | Docker healthcheck |
| `GET /api/v1/health/ready` | MongoDB + Redis connected | Load balancer |
| Vercel deployment status | Frontend availability | Vercel monitoring |

---

## 7. Backup & Recovery

| Component | Strategy | Location |
|-----------|----------|----------|
| MongoDB | `mongodump` cron + cloud upload | Backend `docker/backup/` |
| Redis | AOF persistence volume | Docker volume |
| Event store | Included in MongoDB backup | `business_events` collection |

---

## 8. Related

- [ADR-001](./ADR-001-multi-repository-strategy.md)
- [CI/CD Strategy](../implementation/07-cicd-strategy.md)
- [Development Setup](../implementation/06-development-setup.md)
