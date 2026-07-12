# Universal Document Number Service — Architecture Freeze

**Document ID:** WN-DOM-002  
**Version:** 1.0.0 (Phase 0.5)  
**Status:** FROZEN

---

## 1. Format (Frozen)

```
{PREFIX}-{YYYYMMDD}-{SEQUENCE}
```

| Component | Rule |
|-----------|------|
| PREFIX | 2-4 uppercase letters — see catalog |
| YYYYMMDD | Business date in outlet timezone |
| SEQUENCE | 6-digit zero-padded — `000001` |

**Example:** `SO-20260701-000042`

---

## 2. Document Prefix Catalog

| Prefix | Document Type | Collection |
|--------|---------------|------------|
| `SO` | Sales Order | orders |
| `PAY` | Payment | payments |
| `RTR` | Refund / Return | payments (type=refund) |
| `INV` | Inventory Adjustment Doc | stock_history |
| `PO` | Purchase Order | purchase_orders |
| `GRN` | Goods Received Note | purchase_orders (receipt) |
| `PRD` | Production Batch | production_batches |
| `EXP` | Expense Voucher | expenses |
| `SHF` | Shift Record | shifts |
| `CLS` | Daily Closing | daily_closings |
| `APR` | Approval Request | approval_requests |
| `RCP` | Receipt | digital_receipts |
| `PAY` | Payroll Payment | salary_records |
| `TRF` | Stock Transfer | stock_history |
| `WST` | Waste Document | stock_history |

---

## 3. Sequence Collection

#### `document_sequences`

| Field | Type | Description |
|-------|------|-------------|
| _id | ObjectId | PK |
| businessId | ObjectId | Scope |
| outletId | ObjectId | Scope |
| docType | String | SO, PO, GRN, etc. |
| dateKey | String | YYYYMMDD in outlet timezone |
| lastSequence | Number | Current max |
| updatedAt | Date | |

**Unique Index:** `{ outletId: 1, docType: 1, dateKey: 1 }`

---

## 4. Reset Strategy (Frozen)

| Rule | Detail |
|------|--------|
| Reset frequency | **Daily** — new `dateKey` = sequence resets to 0 |
| Scope | Per `outletId` + `docType` + `dateKey` |
| Not global | Each outlet has independent sequences |
| Never reuse | Gap in sequence is acceptable (failed transactions) |

---

## 5. Concurrency Strategy (Frozen)

```typescript
// Atomic increment inside MongoDB transaction
const seq = await DocumentSequenceRepo.incrementAndGet(
  { outletId, docType, dateKey },
  { session }
);
const number = `${docType}-${dateKey}-${pad(seq, 6)}`;
```

| Mechanism | Detail |
|-----------|--------|
| Atomic `$inc` | `findOneAndUpdate` with `upsert: true` |
| Same transaction | Number assigned before aggregate save |
| Event | `OrderNumberAssigned` etc. emitted with number |
| Idempotency | Command `idempotencyKey` prevents duplicate docs |

---

## 6. Domain Service API

```typescript
DocumentNumberDomainService.nextNumber({
  outletId,
  businessId,
  docType: 'SO',
  timezone: 'Asia/Jakarta',
  occurredAt: Date,
}): string  // returns "SO-20260701-000001"
```

---

## 7. Validation

| Rule | Enforcement |
|------|-------------|
| Format regex | `^[A-Z]{2,4}-\d{8}-\d{6}$` |
| Uniqueness | Unique index on document number field per collection |
| Timezone | dateKey from `tenant_settings.timezone` |

---

## 8. Offline POS

| Rule | Detail |
|------|--------|
| Offline | Temporary local number: `LOCAL-{deviceId}-{deviceSeq}` |
| On sync | Server assigns official number; `OrderNumberReassigned` event |
| Display | Receipt reprinted with official number after sync |

---

## 9. Related

- [20-domain-services-catalog.md](../architecture/20-domain-services-catalog.md)
- [22-transaction-boundaries.md](../architecture/22-transaction-boundaries.md)
