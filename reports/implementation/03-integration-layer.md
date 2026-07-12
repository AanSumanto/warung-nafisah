# Integration Layer — Architecture Freeze

**Document ID:** WN-INF-001  
**Version:** 1.0.0 (Phase 0.5)  
**Status:** FROZEN

---

## 1. Rule

> **All third-party code lives in `backend/src/infrastructure/integrations/`**  
> Domain and Application layers use **ports** (interfaces) only.

---

## 2. Integration Catalog

| Integration | Folder | Port Interface | Phase | Feature Flag |
|-------------|--------|----------------|-------|--------------|
| **Midtrans** | `midtrans/` | `PaymentGatewayPort` | 7+ | `payment.midtrans` |
| **Xendit** | `xendit/` | `PaymentGatewayPort` | 7+ | `payment.xendit` |
| **WhatsApp** | `whatsapp/` | `MessagingPort` | 9 | `digital_receipt.whatsapp` |
| **Email** | `email/` | `EmailPort` | 9 | `digital_receipt.email` |
| **Printer** | `printer/` | `PrinterPort` | 4 | — |
| **QRIS** | `qris/` | `QrisPort` | 4 | — |
| **DigitalOcean Spaces** | `storage/` | `ObjectStoragePort` | 2 | — |
| **Firebase** | `firebase/` | `PushNotificationPort` | 9 | `notification.push` |
| **AI Provider** | `ai/` | `AIAnalyticsPort` | 9+ | `ai.analytics` |

---

## 3. Port Pattern (Frozen)

```typescript
// application/ports/MessagingPort.ts
interface MessagingPort {
  sendWhatsApp(to: string, template: string, params: object): Promise<MessageResult>;
}

// infrastructure/integrations/whatsapp/WhatsAppAdapter.ts
class WhatsAppAdapter implements MessagingPort { ... }
```

---

## 4. Integration Events

| Integration | Inbound Webhook Event |
|-------------|----------------------|
| Midtrans | `PaymentReceived` (from webhook) |
| Xendit | `PaymentReceived` |
| WhatsApp | Delivery status → `NotificationSent` / `NotificationFailed` |

All inbound webhooks:
1. Validate signature
2. Map to domain command
3. Append event with `actorType: integration`

---

## 5. Folder Structure

```
infrastructure/integrations/
├── midtrans/
│   ├── MidtransAdapter.ts
│   ├── MidtransWebhookController.ts
│   └── midtrans.config.ts
├── xendit/
├── whatsapp/
├── email/
│   ├── SmtpAdapter.ts
│   └── SendGridAdapter.ts
├── printer/
│   ├── EscPosAdapter.ts
│   └── PrinterMockAdapter.ts      # dev/test
├── qris/
├── storage/
│   ├── SpacesAdapter.ts
│   └── S3Adapter.ts
├── firebase/
└── ai/
    ├── OpenAIAdapter.ts           # future
    └── AIAnalyticsAdapter.ts
```

---

## 6. Failure Handling

| Rule | Detail |
|------|--------|
| Integration failure never rolls back business event | Saga retry |
| Circuit breaker | After 5 failures → `SystemHealthAlert` |
| Mock adapters | Used in dev/test via env `INTEGRATION_MODE=mock` |

---

## 7. Secrets

All API keys in environment variables — never in `tenant_settings` or code.

```
MIDTRANS_SERVER_KEY=
XENDIT_SECRET_KEY=
WHATSAPP_API_TOKEN=
SPACES_ACCESS_KEY=
FIREBASE_SERVICE_ACCOUNT=
```
