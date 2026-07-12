# Testing

**Status:** Pending — Phase 2+

Test plans and results will be created starting from Phase 2 (Project Initialization).

## Planned Documents

| Document | Description | Phase |
|----------|-------------|-------|
| `01-test-strategy.md` | Overall testing approach | Phase 2 |
| `02-unit-test-plan.md` | Domain and service layer tests | Phase 2 |
| `03-integration-test-plan.md` | API integration tests | Phase 3+ |
| `04-financial-reconciliation-tests.md` | Zero duplicate input verification | Phase 4 |
| `05-e2e-test-plan.md` | End-to-end user flows | Phase 4 |
| `06-load-test-plan.md` | Performance and load testing | Phase 10 |
| `07-uat-checklist.md` | User acceptance testing | Phase 10 |

## Testing Principles

- ≥ 80% coverage on domain and service layers
- Every financial transaction type has integration test
- Reconciliation scripts verify ledger consistency
- UAT with real cashier and kitchen staff before production
