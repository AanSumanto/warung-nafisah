# Warung Nafisah ERP — Frontend

Next.js 15 frontend foundation (Sprint 3A).

## Tech Stack

- Next.js 15 (App Router)
- React 19
- TypeScript
- Material UI 6
- TanStack Query
- Axios
- React Hook Form + Zod
- Notistack

## Getting Started

```bash
cp .env.example .env.local
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — empty App Shell (no business modules).

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Development server (port 3000) |
| `npm run build` | Production build |
| `npm run start` | Production server |
| `npm test` | Unit tests (Vitest) |
| `npm run lint` | ESLint |

## Structure

```
src/
├── app/              # Next.js App Router
│   └── (shell)/      # App Shell route group
├── features/         # Business modules (future sprints)
├── shared/
│   ├── components/   # Layout, UI, feedback
│   ├── providers/    # Theme, Query, Auth, Permission, Snackbar
│   ├── lib/          # API client, env
│   └── theme/        # MUI theme
└── types/            # Shared TypeScript types
```

## Sprint 3A Scope

Foundation only — no Login, Dashboard, POS, Inventory, or other business pages.
