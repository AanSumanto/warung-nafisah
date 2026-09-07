# LOYALTY-02 — Security Review

**Document ID:** WN-LOYALTY-02-SEC  
**Date:** 2026-09-07

| Question | Result | Evidence |
|----------|--------|----------|
| Auth required on all loyalty config APIs? | PASS | `auth` middleware |
| Kasir cannot mutate program/rewards? | PASS | `requireRole('owner')`; test 401 |
| Owner cannot accidentally enable earning? | PASS | `enabled:true` → 400 blocked |
| Mass assignment of version/timestamps? | PASS | Not accepted from body; actor from JWT |
| Menu injection / arbitrary filter API? | PASS | Exact kodeMenu lookup only |
| Unauthenticated access? | PASS | 401 |
| Mongo internals leaked? | PASS | ValidationException messages |
| Startup mutates config? | PASS | Indexes only |
| Installer silent overwrite? | PASS | Conflict → fail |

**Residual:** Rate limiting on admin config APIs is P3 (owner-only, authenticated).
