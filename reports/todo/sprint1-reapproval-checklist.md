# Sprint 1 Re-Approval Checklist

**Date:** 2026-07-11  
**Hotfix Version:** 0.5.1  
**Blocked:** Sprint 2, Sprint 3

---

## Gate Criteria

| # | Criterion | Automated | Manual | Status |
|---|-----------|-----------|--------|--------|
| 1 | MongoDB Connected | — | Start server with valid `MONGODB_URI` | ⬜ |
| 2 | Redis Connected | Unit tests | Start server with valid `REDIS_URL` | ⬜ |
| 3 | Health `/api/v1/health/ready` PASS | ✅ 4 tests | curl against running server | ⬜ |
| 4 | Build PASS | ✅ `npm run build` | — | ✅ |
| 5 | Test PASS | ✅ 51/51 | — | ✅ |
| 6 | No reconnect log spam | — | Observe logs 60s after start | ⬜ |
| 7 | Invalid Redis fails fast | ✅ unit | Wrong password → server exits | ⬜ |

---

## Environment Setup

```env
REDIS_URL=rediss://default:YOUR_PASSWORD@YOUR_HOST:6379
MONGODB_URI=mongodb://...
MONGODB_DB_NAME=warung_nafisah
```

**Do not set:** `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD`, `REDIS_USERNAME`, `REDIS_TLS`

---

## Approval

- [ ] Operator manual verification complete
- [ ] Sprint 1 approved
- [ ] Sprint 2 may proceed
