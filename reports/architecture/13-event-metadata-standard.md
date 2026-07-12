# Event Metadata Standard — Architecture Freeze

**Document ID:** WN-ARCH-013  
**Version:** 1.0.0 (Phase 0.5)  
**Status:** FROZEN

---

## 1. Envelope Structure

Every document in `business_events` follows this frozen envelope:

```typescript
interface BusinessEventEnvelope<TPayload> {
  // ─── Identity ───
  eventId: string;              // UUID v4 — global idempotency key
  eventName: string;            // PascalCase past tense — e.g. "SaleCompleted"
  eventVersion: number;         // Schema version — e.g. 1

  // ─── Aggregate ───
  aggregateId: string;          // ObjectId string of root aggregate
  aggregateType: string;        // Order, PurchaseOrder, Shift, etc.

  // ─── Tenant Scope (required) ───
  businessGroupId: string;
  businessId: string;
  outletId: string;
  warehouseId: string | null;   // null when not warehouse-scoped

  // ─── Actor ───
  actorId: string;              // userId or "system"
  actorType: ActorType;         // user | system | device | integration

  // ─── Operational Context ───
  shiftId: string | null;
  deviceId: string | null;      // POS/KDS device fingerprint
  sessionId: string | null;     // Login session

  // ─── Tracing ───
  correlationId: string;        // End-to-end request chain (UUID)
  causationId: string | null;   // eventId of parent event
  requestId: string;            // HTTP request ID (from middleware)

  // ─── Network ───
  ipAddress: string | null;
  userAgent: string | null;

  // ─── Temporal ───
  timezone: string;             // IANA — e.g. "Asia/Jakarta"
  occurredAt: Date;             // Business time (user-facing)
  createdAt: Date;              // Server persistence time (immutable)

  // ─── Sequencing ───
  sequenceNumber: number;         // Monotonic per outlet stream

  // ─── Payload ───
  payload: TPayload;            // Typed per eventName + eventVersion
}
```

---

## 2. Field Reference

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `eventId` | UUID string | ✅ | Unique globally; dedup key for sync and handlers |
| `eventName` | string | ✅ | Past tense PascalCase — see naming convention doc |
| `eventVersion` | integer ≥ 1 | ✅ | Payload schema version |
| `aggregateId` | ObjectId string | ✅ | Root entity ID |
| `aggregateType` | string | ✅ | Aggregate class name |
| `businessGroupId` | ObjectId string | ✅ | Top tenant |
| `businessId` | ObjectId string | ✅ | Legal entity / brand |
| `outletId` | ObjectId string | ✅ | Physical location |
| `warehouseId` | ObjectId string \| null | ⚠️ | Required for inventory events |
| `actorId` | string | ✅ | Who triggered; `"system"` for cron/jobs |
| `actorType` | enum | ✅ | `user`, `system`, `device`, `integration` |
| `shiftId` | ObjectId string \| null | ⚠️ | Required for POS/shift events |
| `deviceId` | string \| null | ⚠️ | Required for POS/KDS offline events |
| `sessionId` | string \| null | ❌ | Auth session reference |
| `correlationId` | UUID string | ✅ | Links all events in one user action |
| `causationId` | UUID string \| null | ❌ | Direct parent eventId |
| `requestId` | string | ✅ | From `X-Request-Id` header |
| `ipAddress` | string \| null | ❌ | Client IP |
| `userAgent` | string \| null | ❌ | Client UA |
| `timezone` | IANA string | ✅ | From `tenant_settings.timezone` |
| `occurredAt` | ISO Date | ✅ | Business timestamp |
| `createdAt` | ISO Date | ✅ | Server write time |
| `sequenceNumber` | long | ✅ | Per-outlet monotonic counter |
| `payload` | object | ✅ | Event-specific typed body |

---

## 3. ActorType Enum

| Value | When Used |
|-------|-----------|
| `user` | Human action via UI |
| `system` | Cron, replay, migration |
| `device` | POS/KDS autonomous (offline sync) |
| `integration` | Webhook from Midtrans, WhatsApp, etc. |

---

## 4. Sequence Number Strategy

| Rule | Detail |
|------|--------|
| Scope | Per `outletId` stream |
| Generation | Atomic `$inc` on `outlet_sequences` collection |
| Same transaction | Sequence assigned inside event append transaction |
| Offline | Device uses `deviceSequence`; server assigns `sequenceNumber` on sync |
| Ordering | Consumers process by `sequenceNumber` within outlet |

---

## 5. Money in Payload

All monetary fields inside `payload` use Money Value Object shape:

```json
{
  "amount": "4500000",
  "currency": "IDR",
  "precision": 0,
  "roundingMode": "HALF_UP"
}
```

See [domain/01-money-value-object.md](../domain/01-money-value-object.md).

---

## 6. Validation Rules (Frozen)

| Rule | Enforcement |
|------|-------------|
| `eventId` must be UUID v4 | Validator on append |
| `eventName` must exist in Event Catalog | Registry check |
| `eventVersion` must be registered for `eventName` | Registry check |
| `businessGroupId` + `businessId` + `outletId` always present | Validator |
| `occurredAt` ≤ `createdAt` + 5 min tolerance | Clock skew guard |
| `payload` validated against JSON Schema for name+version | AJV / Zod |

---

## 7. Example: SaleCompleted v1

```json
{
  "eventId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "eventName": "SaleCompleted",
  "eventVersion": 1,
  "aggregateId": "665f1a2b3c4d5e6f7a8b9c0d",
  "aggregateType": "Order",
  "businessGroupId": "665f00000000000000000001",
  "businessId": "665f00000000000000000002",
  "outletId": "665f00000000000000000003",
  "warehouseId": null,
  "actorId": "665f00000000000000000010",
  "actorType": "user",
  "shiftId": "665f00000000000000000020",
  "deviceId": "pos-tablet-001",
  "sessionId": "sess_abc123",
  "correlationId": "corr_xyz789",
  "causationId": "prior-event-id-or-null",
  "requestId": "req_20260701_001",
  "ipAddress": "192.168.1.50",
  "userAgent": "Mozilla/5.0 ...",
  "timezone": "Asia/Jakarta",
  "occurredAt": "2026-07-01T10:30:00.000Z",
  "createdAt": "2026-07-01T10:30:00.152Z",
  "sequenceNumber": 10482,
  "payload": { }
}
```

Payload schema defined in [17-domain-event-catalog.md](./17-domain-event-catalog.md).
