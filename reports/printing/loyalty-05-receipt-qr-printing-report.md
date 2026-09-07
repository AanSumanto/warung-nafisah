# LOYALTY-05 — Printing Report

**Document ID:** WN-LOYALTY-05-PRT  
**Date:** 2026-09-07

## Pipeline

Receipt Object → compact thermal lines → EscPosRenderer / PreviewRenderer → RawBT.

## Member block (58mm)

```
------------------------------
NAFISAH REWARDS
Member: Aan — 08******123
Poin transaksi          +4
Total poin               27
Tinggal 3 poin lagi untuk Gratis Nasi Putih
[QR if gated on]
Scan untuk cek poin & reward   OR   Cek poin di Nafisah Rewards
------------------------------
```

## QR

- Native ESC/POS GS ( k when `supportsQr` + `memberPortalUrl`
- Failure caught — receipt continues
- Preview: `[QR Nafisah Rewards]` placeholder (not pixel-identical to printer)

## Hardware

| Check | Status |
|-------|--------|
| SOFTWARE_QR_VERIFICATION | PASS |
| PHYSICAL_BP_ECO58_QR_VERIFICATION | PENDING |

Do not enable `LOYALTY_RECEIPT_QR_ENABLED` in production until physical PASS + LOYALTY-06 portal live.
