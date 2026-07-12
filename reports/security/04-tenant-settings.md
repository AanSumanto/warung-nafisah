# Tenant Settings — Architecture Freeze

**Document ID:** WN-SEC-004  
**Version:** 1.0.0 (Phase 0.5)  
**Status:** FROZEN

---

## 1. Collection: `tenant_settings`

One document per `businessId`. Outlet overrides in `outlet_settings` (optional).

| Field | Type | Description |
|-------|------|-------------|
| _id | ObjectId | PK |
| businessGroupId | ObjectId | |
| businessId | ObjectId | **Unique** |
| timezone | string | IANA — default `Asia/Jakarta` |
| currency | string | ISO 4217 — default `IDR` |
| money | object | `{ precision: 0, roundingMode: "HALF_UP" }` |
| tax | object | See §2 |
| printer | object | See §3 |
| receipt | object | See §4 |
| approval | object | See §5 |
| stockPolicy | object | See §6 |
| workingHours | object | See §7 |
| kitchen | object | See §8 |
| paymentMethods | array | See §9 |
| featureFlags | object | See feature-flags doc |
| documentNumbering | object | `{ resetDaily: true, sequencePadding: 6 }` |
| backup | object | `{ localEnabled: true, cloudEnabled: true, retentionDays: 90 }` |
| createdAt | Date | |
| updatedAt | Date | |

**Index:** `{ businessId: 1 }` unique

---

## 2. Tax Settings

```json
{
  "enabled": false,
  "rate": 0,
  "inclusive": true,
  "name": "PPN"
}
```

---

## 3. Printer Settings

```json
{
  "enabled": true,
  "type": "escpos",
  "connection": "usb",
  "paperWidth": 58,
  "autoPrint": true
}
```

---

## 4. Receipt Settings

```json
{
  "header": "Warung Nafisah",
  "footer": "Terima kasih",
  "showLogo": true,
  "showQr": true,
  "whatsappEnabled": false,
  "emailEnabled": false
}
```

---

## 5. Approval Settings

```json
{
  "discountThreshold": { "amount": "50000", "currency": "IDR", "precision": 0 },
  "voidRequiresApproval": true,
  "refundRequiresApproval": true,
  "purchaseThreshold": { "amount": "5000000", "currency": "IDR", "precision": 0 },
  "stockAdjustmentThreshold": { "amount": "100000", "currency": "IDR", "precision": 0 },
  "payrollRequiresOwner": true,
  "approvalExpiryMinutes": 60
}
```

---

## 6. Stock Policy

```json
{
  "allowNegativeStock": false,
  "fifoEnabled": true,
  "expiryAlertDays": 7,
  "lowStockAlertEnabled": true,
  "autoWasteOnExpiry": false
}
```

---

## 7. Working Hours

```json
{
  "shifts": [
    { "name": "morning", "start": "07:00", "end": "14:00", "menuShift": "morning" },
    { "name": "evening", "start": "17:00", "end": "22:00", "menuShift": "evening" }
  ],
  "closingDeadline": "23:00"
}
```

---

## 8. Kitchen Configuration

```json
{
  "stations": ["grill", "fryer", "prep", "drink"],
  "routing": {
    "Pecel Lele": "fryer",
    "Ayam Penyet": "grill",
    "Gendum Kuah Tetelan": "prep"
  },
  "alertAfterMinutes": 15
}
```

---

## 9. Payment Methods

```json
[
  { "code": "cash", "enabled": true, "label": "Tunai" },
  { "code": "qris", "enabled": true, "label": "QRIS" },
  { "code": "transfer", "enabled": true, "label": "Transfer" }
]
```

---

## 10. Outlet Overrides (`outlet_settings`)

| Field | Can Override |
|-------|--------------|
| workingHours | ✅ |
| kitchen | ✅ |
| printer | ✅ |
| paymentMethods | ✅ |
| tax | ❌ (business level) |
| currency | ❌ |
| featureFlags | ❌ (business level) |

---

## 11. Event

Settings change → `TenantSettingsUpdated` event → handlers refresh cached settings.
