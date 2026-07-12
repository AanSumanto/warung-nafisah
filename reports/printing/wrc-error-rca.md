# RawBT WRC Error — Root Cause Analysis

**Date:** 2026-07-12  
**Symptom:** RawBT opens, shows **Sent: 2 / Received: 0** and **wrc error**  
**Status:** Fix applied (round 3)

## Summary

**WRC Error** on RawBT = Bluetooth write failed or payload corrupted before reaching the printer. After fixing URI format and base64 encoding, the remaining root cause is **broken user gesture** on Chrome Android.

## Root Causes

### 1. Lost user gesture before intent dispatch (primary — round 3)

Chrome Android requires a **synchronous** `window.location.href = intent:...` inside the print button click handler.

Our flow was:

```
onClick → await printReceipt() → await ensureConnected() → await adapter.print() → dispatch
```

Any `await` before `window.location.href` exits the user-gesture context. Chrome then delivers a **truncated or invalid intent** to RawBT → decode yields ~2 bytes (`ESC @`) → **Sent: 2 / Received: 0** + **wrc error**.

Fix:
- `printReceiptSync()` — no `await` before dispatch
- POS buttons call `printReceiptSync()` directly from `onClick`
- `PrintService.dispatchRawBtNow()` runs synchronously

### 2. Wrong dispatch channel (round 2)

Anchor `href` assignment can normalize `+` in base64. Official web path is Mike42 intent via `window.location.href`:

```
intent:base64,<raw_base64>#Intent;scheme=rawbt;package=ru.a402d.rawbtprinter;end;
```

### 3. URL-encoded base64 (round 2)

`encodeURIComponent` on base64 corrupts RawBT decode. Use raw base64 only.

### 4. ESC/POS complexity (round 3)

Simplified renderer: plain text lines + single `ESC @` init, no per-line bold/align toggles (better BP-ECO58 compatibility).

## Fix Applied (round 3)

1. **`navigateRawBtIntent()`** — `window.location.href = intentUri` (Mike42)
2. **`printReceiptSync()`** — synchronous dispatch from click handler
3. **No `await ensureConnected()`** before RawBT dispatch
4. **Simpler ESC/POS** — text-only lines after init
5. **Base64 round-trip validation** before dispatch

## Verification on device

1. Deploy latest frontend to Vercel
2. Hard refresh Chrome (clear cache)
3. POS → bayar → **Cetak Struk** (must tap button — not auto-print)
4. RawBT should print full receipt without wrc error
5. If still fails: RawBT → Settings → printer → verify Bluetooth Classic, 58mm / 384 dots, Test Print works
