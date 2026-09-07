# LOYALTY-04 — Database Report

**Document ID:** WN-LOYALTY-04-DB  
**Date:** 2026-09-07

## Order schema (additive optional)

- `customerId` string sparse index
- `customerSnapshot` embedded `{ customerId, phoneMasked, name? }`

Historical orders without these fields deserialize normally. No backfill. No startup mutation of orders/menus/program.

Indexes via `createIndexes` only.
