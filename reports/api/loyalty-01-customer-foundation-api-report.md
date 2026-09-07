# LOYALTY-01 — Customer Foundation API Report

**Document ID:** WN-LOYALTY-01-API  
**Date:** 2026-09-07  
**Status:** PASS

---

## 1. Base Path

All routes under `/api/v1` via `v1Router`.

Authentication: `Authorization: Bearer <jwt>`  
Roles: `owner`, `kasir`

---

## 2. Endpoints

### POST `/api/v1/customers`

Register a new member.

**Request:**
```json
{
  "phone": "081234567890",
  "name": "Aan"
}
```

`name` optional. `registeredBy` is **not** accepted from body — derived from JWT `sub`.

**Success:** `201`
```json
{
  "success": true,
  "data": {
    "id": "<uuid>",
    "publicMemberId": "<32-char base64url>",
    "phoneMasked": "0812******90",
    "name": "Aan",
    "currentPoints": 0,
    "lifetimeEarnedPoints": 0,
    "lifetimeRedeemedPoints": 0,
    "totalSpending": 0,
    "transactionCount": 0,
    "lastTransactionAt": null,
    "status": "active",
    "registeredAt": "<ISO8601>"
  }
}
```

**Errors:**
| Status | Case |
|--------|------|
| 401 | Missing/invalid token |
| 400 | Invalid phone / body |
| 400 | Duplicate phone (`Nomor HP sudah terdaftar`) |

---

### GET `/api/v1/customers/lookup?phone=`

Lookup by any accepted phone form (`08` / `62` / `+62`). Server normalizes.

**Success:** `200` — same DTO as register  
**Errors:** 401, 400 (invalid phone), 404 (not found)

---

### GET `/api/v1/customers/:customerId`

Read by internal customer id.

**Success:** `200` — same DTO  
**Errors:** 401, 400 (empty id), 404

---

## 3. Privacy Rules

| Field | In API? |
|-------|---------|
| `phoneMasked` | ✅ |
| `phoneNormalized` | ❌ |
| Raw Mongo document | ❌ |
| `registeredBy` | ❌ (not in DTO; stored internally) |

---

## 4. Error Semantics

Uses existing `ResponseWrapper` + `BaseException`:

| Exception | HTTP | Code |
|-----------|------|------|
| `ValidationException` | 400 | `SYS_001` (details may include `CUSTOMER_ALREADY_EXISTS`) |
| `NotFoundException` | 404 | `SYS_002` |
| `UnauthorizedException` | 401 | auth codes |

Mongo `E11000` never exposed to clients.

---

## 5. Intentionally Absent APIs

- List all customers
- Public member portal
- Point adjust / earn / redeem
- Customer delete / merge / block UI

---

## 6. Validation

Zod schemas:

- register: `phone` string 1–32, `name` optional max 120
- lookup: `phone` query string 1–32

Domain layer performs authoritative phone normalization after Zod.
