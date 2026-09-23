# LOYALTY-GO-LIVE-02 — BP-ECO58 Physical Test

**Document ID:** WN-LOYALTY-GO-LIVE-02-PHYS  
**Date:** 2026-09-09  
**PHYSICAL_BP_ECO58_QR_VERIFICATION:** **PENDING**  
**LOYALTY_RECEIPT_QR_GO_LIVE_READINESS:** **NOT_READY**

## Hardware availability (this agent)

No Blueprint ECO-58 / RawBT Android device was available to this session.  
Software printing suite PASS does **not** equal physical PASS.

## Physical matrix

| ID | Test | Result |
|----|------|--------|
| P01 | Nonmember receipt | **PENDING** |
| P02 | Member text receipt (QR off) | **PENDING** |
| P03 | Member receipt with QR (staging QR gate on) | **PENDING** |
| P04 | QR scan → HTTPS `/rewards/member/<opaque>` (token redacted in evidence) | **PENDING** |
| P05 | Reward receipt | **PENDING** |
| P06 | Reprint | **PENDING** |

## RawBT checks (when hardware available)

| Check | Result |
|-------|--------|
| RawBT receives payload | PENDING |
| Text prints | PENDING |
| QR does not crash printer | PENDING |
| QR scans | PENDING |
| Receipt not truncated | PENDING |
| Reprint works | PENDING |
| Printer returns usable | PENDING |
| QR fail but text survives | Document if observed |

## Operator instructions

1. Use **staging** with `LOYALTY_RECEIPT_QR_ENABLED=true` + HTTPS `PUBLIC_APP_URL` only for P03–P04.  
2. Print on physical BP-ECO58 via RawBT.  
3. Photograph strips (redact PII).  
4. Scan with a normal Android phone; confirm destination path shape without pasting full token.  
5. Attach evidence to this file or a dated addendum.  
6. Restore QR gate OFF after test unless staging intentionally retains it.

## Impact

Missing hardware **does not** fail core phone-based loyalty readiness by itself, provided `LOYALTY_RECEIPT_QR_ENABLED` stays **false** until physical PASS.
