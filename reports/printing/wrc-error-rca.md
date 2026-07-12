# RawBT WRC Error — Root Cause Analysis

**Date:** 2026-07-12  
**Symptom:** RawBT opens, shows **Sent: 2 / Received: 0** and **wrc error**  
**Status:** Fix applied (round 2)

## Summary

**WRC Error** = RawBT could not deliver valid ESC/POS bytes to the printer. The app opens and Bluetooth is paired, but the decoded payload was corrupted.

## Root Causes

### 1. URL-encoded base64 in intent (primary — round 2)

`encodeURIComponent(base64Data)` was applied before sending. Mike42 `RawbtPrintConnector` uses **raw base64** with no encoding:

```php
echo "intent:base64," . base64_encode($this->getData()) . "#Intent;scheme=rawbt;package=ru.a402d.rawbtprinter;end;";
```

RawBT decodes the base64 segment directly. Percent-encoded sequences (`%2B`, `%2F`, `%3D`) are **not** valid base64 → decode yields garbage (often only a few bytes) → **Sent: 2 / Received: 0** and **wrc error**.

### 2. Wrong dispatch channel (secondary — round 2)

We used `window.location.href = intent:base64,...` which navigates the SPA and never reached the `rawbt:base64,` fallback (assignment does not throw).

Official binary channel per [DemoRawBtPrinter test2](https://github.com/402d/DemoRawBtPrinter):

```java
String url = "rawbt:base64," + base64ToPrint;
Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
```

Fix: dispatch `rawbt:base64,<raw_base64>` via hidden `<a>` click.

### 3. Incorrect intent prefix (round 1 — already fixed)

`intent:rawbt:base64,<data>` → must be `intent:base64,<data>#Intent;scheme=rawbt;...`

### 4. UTF-8 in ESC/POS (round 1 — already fixed)

`TextEncoder` → Latin-1 single-byte encoding in `EscPosRenderer`.

## Fix Applied (round 2)

1. **Remove** `encodeURIComponent` from base64 in all RawBT URIs
2. **Primary dispatch:** `rawbt:base64,<raw_base64>` via `openRawBtUri()` (anchor click)
3. **Intent URI** kept for logging/audit only (Mike42 format, raw base64)
4. **No** `window.location.href` navigation during print

## Verification on device

1. Deploy latest frontend to Vercel
2. Android Chrome → POS → Cetak Struk
3. Console: `[RawBT] dispatch:attempt` method = `scheme`, URI starts with `rawbt:base64,`
4. RawBT dialog: no **wrc error**; receipt prints on BP-ECO58
5. If RawBT native Test Print works but web still fails, compare payload hex in console log
