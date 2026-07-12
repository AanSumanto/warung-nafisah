# Feature Flags — Architecture Freeze

**Document ID:** WN-SEC-003  
**Version:** 1.0.0 (Phase 0.5)  
**Status:** FROZEN

---

## 1. Storage

Feature flags stored in `tenant_settings.featureFlags` per `businessId`.  
Changes emit `FeatureFlagToggled` event.

---

## 2. Flag Catalog (Frozen)

| Flag Key | Default (Warung Nafisah) | Module Gated |
|----------|--------------------------|--------------|
| `kitchen.kds` | `true` | KDS, Kitchen projections |
| `crm.enabled` | `false` | Customer, Loyalty |
| `payroll.enabled` | `false` | HR, Salary |
| `ai.analytics` | `false` | AI projections, export API |
| `ai.forecasting` | `false` | Demand forecast |
| `loyalty.enabled` | `false` | LoyaltyPointsEarned events |
| `marketplace.enabled` | `false` | External marketplace sync |
| `franchise.mode` | `false` | Multi-business UI |
| `inventory.batch_tracking` | `true` | FIFO batches (core) |
| `offline.pos_sync` | `true` | Offline event queue |
| `digital_receipt.whatsapp` | `false` | WhatsApp integration |
| `digital_receipt.email` | `false` | Email integration |
| `payment.midtrans` | `false` | Midtrans gateway |
| `payment.xendit` | `false` | Xendit gateway |
| `notification.push` | `false` | Browser push |
| `notification.whatsapp` | `false` | WA alerts |
| `assets.gas_monitoring` | `true` | Gas cylinder alerts |
| `reports.export_pdf` | `true` | PDF export |
| `approval.strict_mode` | `true` | All approvals enforced |

---

## 3. Evaluation Order

```
1. Load tenant_settings for businessId
2. Check featureFlags[key]
3. If false → 403 FEATURE_DISABLED (SYSTEM_005)
4. If true → proceed to RBAC
```

---

## 4. API

```
GET  /api/v1/queries/settings/feature-flags
PUT  /api/v1/commands/toggle-feature-flag  (Owner/Admin only)
```

---

## 5. Frontend

```typescript
const { isEnabled } = useFeatureFlag('kitchen.kds');
if (!isEnabled) return <FeatureDisabled />;
```

Flags cached in TanStack Query; invalidated on `FeatureFlagToggled` WS event.
