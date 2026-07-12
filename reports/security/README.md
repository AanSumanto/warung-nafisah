# Security Architecture

**Status:** Pending — Phase 1

Detailed security architecture will be created during Phase 1.

## Planned Documents

| Document | Description | Phase |
|----------|-------------|-------|
| `01-security-architecture.md` | Overall security design | Phase 1 |
| `02-rbac-permission-matrix.md` | Detailed role permissions per endpoint | Phase 1 |
| `03-jwt-token-flow.md` | Token lifecycle, refresh, revocation | Phase 1 |
| `04-input-validation-rules.md` | Validation schemas per endpoint | Phase 1 |
| `05-audit-log-specification.md` | What gets logged, retention policy | Phase 1 |
| `06-security-checklist.md` | Pre-production security checklist | Phase 10 |

## Security Requirements Summary

See [Non-Functional Requirements — Security](../architecture/04-non-functional-requirements.md#3-security) for the full list.

Key controls:
- JWT authentication (15 min access, 7 day refresh)
- bcrypt password hashing (cost ≥ 12)
- RBAC middleware on every protected route
- Rate limiting (100 req/min/IP)
- Helmet security headers
- CORS whitelist
- Input validation (Joi/Zod)
- Immutable audit logs
- Investor read-only enforcement
