# Warung Nafisah ERP — Backend API

Express API with MongoDB and Redis. POS MVP + auth.

## Prerequisites

- Node.js 20+
- MongoDB (Atlas or managed)
- Redis (Upstash, Redis Cloud, or self-hosted)
- PM2 (production on Nevacloud)

## Local setup

```bash
cd backend
cp .env.example .env
# Edit .env — set MONGODB_URI, REDIS_URL, JWT_SECRET
npm install
```

## Run (development)

```bash
npm run dev
```

Server: **http://localhost:5000**

## Build

```bash
npm run build
npm start
```

## Production — Nevacloud + PM2

### 1. Server prerequisites

```bash
# Install Node 20+ and PM2 globally
npm install -g pm2
pm2 startup   # follow printed instructions (run as root once)
```

### 2. Deploy from monorepo root

```bash
git clone <repo-url> /var/www/warung-nafisah
cd /var/www/warung-nafisah
npm ci
npm run build --workspace=@warung-nafisah/backend
```

### 3. Environment

```bash
cd backend
cp .env.example .env
nano .env
```

Production `.env` minimum:

| Variable | Example |
|----------|---------|
| `NODE_ENV` | `production` |
| `PORT` | `5000` |
| `HOST` | `0.0.0.0` |
| `MONGODB_URI` | `mongodb+srv://...` |
| `MONGODB_DB_NAME` | `warung_nafisah` |
| `REDIS_URL` | `rediss://...` |
| `JWT_SECRET` | strong random 64+ chars |
| `CORS_ORIGINS` | `https://your-app.vercel.app` |
| `LOG_LEVEL` | `warn` |

### 4. Start with PM2

```bash
cd backend
npm run pm2:start
pm2 save
```

### 5. Update after git pull

```bash
cd /var/www/warung-nafisah
git pull
npm ci
npm run deploy:pm2 --workspace=@warung-nafisah/backend
pm2 save
```

### PM2 commands

| Command | Description |
|---------|-------------|
| `npm run pm2:start` | First-time start (production env) |
| `npm run pm2:startOrReload` | Start or zero-downtime reload |
| `npm run deploy:pm2` | Build + startOrReload |
| `npm run pm2:restart` | Hard restart |
| `npm run pm2:stop` | Stop process |
| `npm run pm2:logs` | Tail logs |
| `npm run pm2:status` | Process status |

Logs are written to `backend/logs/pm2-*.log`.

PM2 sends `SIGINT` / `SIGTERM` on stop — the server closes HTTP, BullMQ, Redis, and MongoDB gracefully.

## Health endpoints

| Endpoint | Purpose |
|----------|---------|
| `GET /api/v1/health/live` | Liveness |
| `GET /api/v1/health/ready` | Readiness (MongoDB + Redis + BullMQ) |
| `GET /api/v1/health/health` | Detailed (disabled in production) |

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Development (tsx watch) |
| `npm run build` | Compile TypeScript → `dist/` |
| `npm start` | Run `dist/server.js` |
| `npm test` | Vitest |

## Environment variables

See `.env.example`.
