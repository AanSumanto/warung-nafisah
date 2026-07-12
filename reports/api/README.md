# API Specifications

**Status:** Pending — Phase 1

API specifications will be created during Phase 1 (System Architecture & Design).

## Planned Documents

| Document | Description | Phase |
|----------|-------------|-------|
| `01-api-overview.md` | REST conventions, versioning, error codes | Phase 1 |
| `02-openapi-spec.yaml` | Full OpenAPI 3.0 specification | Phase 1 |
| `03-auth-endpoints.md` | Authentication API detail | Phase 1 |
| Per-module endpoint docs | Created during each module phase | Phase 3+ |

## API Design Principles (Pre-decided)

- RESTful JSON API
- Base path: `/api/v1`
- JWT Bearer authentication
- Standard error response format
- Pagination: cursor-based for lists
- All endpoints scoped by `outletId` (from JWT or query param)
- Idempotent write operations where applicable
