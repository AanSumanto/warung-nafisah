# LOYALTY-GO-LIVE-01 — BP-ECO58 Physical Test

**Document ID:** WN-LOYALTY-GO-LIVE-01-PHYS  
**Date:** 2026-09-09  
**Printer:** Blueprint ECO-58 / BP-ECO58 · 58mm · RawBT  
**PHYSICAL_BP_ECO58_QR_VERIFICATION:** **PENDING**

## Rule

Code inspection and software printing tests are **not** sufficient for PASS. Hardware evidence required.

No physical printer was available/attached during this readiness session. **Do not fake PASS.**

## Software baseline (not physical PASS)

- Frontend printing suite: PASS (includes RawBT / BP-ECO58 profile tests)
- Prior LOYALTY-05: `SOFTWARE_QR_VERIFICATION = PASS`

## Checklist (operator on-site)

| ID | Test | Pass criteria | Result |
|----|------|---------------|--------|
| UAT-P01 | Nonmember receipt | Text OK; cut/feed OK; no hang | PENDING |
| UAT-P02 | Member text (QR off) | Loyalty block readable; no token/phone raw | PENDING |
| UAT-P03 | Member + QR (staging gate on) | QR printable; not truncated; strip practical | PENDING |
| UAT-P04 | Scan Android | Opens `https://…/rewards/member/<opaque>`; no PII query | PENDING |
| UAT-P05 | Reward receipt | Rp0 reward line; poin used/tx/total | PENDING |
| UAT-P06 | Reprint | Stable; no second earn/redeem | PENDING |
| — | Repeated print | RawBT accepts; no reject / hang | PENDING |
| — | Failed QR command | Textual receipt still usable | PENDING |

## Evidence to attach later

- Photo of printed strip (redact any accidental PII)
- Scan screenshot of destination URL with token **redacted**
- Device model used for scan
- Staging `PUBLIC_APP_URL` host only (no secrets)

## Impact on go-live

| Track | Impact |
|-------|--------|
| Core loyalty (phone + cashier) | QR PENDING does **not** block if `LOYALTY_RECEIPT_QR_ENABLED` stays false |
| Receipt QR activation | **Blocked** until this document records PASS |
