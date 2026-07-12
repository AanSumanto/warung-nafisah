# RawBT WRC Error — Root Cause Analysis

**Date:** 2026-07-12  
**Symptom:** RawBT opens, printer connected, Test Print shows **WRC Error**  
**Status:** Fixed

## Summary

**WRC Error** = RawBT rejected the payload as **Wrong RawBT Content** — invalid URI / protocol format, not a Bluetooth connection issue.

## Root Causes

### 1. Incorrect Intent URI format (primary)

Our implementation sent:

```
intent:rawbt:base64,<data>#Intent;scheme=rawbt;package=ru.a402d.rawbtprinter;end;
```

Official RawBT / Mike42 `RawbtPrintConnector` format:

```
intent:base64,<data>#Intent;scheme=rawbt;package=ru.a402d.rawbtprinter;end;
```

The extra `rawbt:` prefix inside the intent payload caused RawBT to mis-parse the content → **WRC Error**.

References:
- [Mike42 RawbtPrintConnector.php](https://github.com/mike42/escpos-php/blob/development/src/Mike42/Escpos/PrintConnectors/RawbtPrintConnector.php)
- [402d DemoRawBtPrinter test16](https://github.com/402d/DemoRawBtPrinter) — `base64,` + encoded bytes

### 2. Base64 URL corruption (secondary)

Standard base64 contains `+`, `/`, `=` which can corrupt when embedded in `window.location.href` without encoding.

Fix: `encodeURIComponent(base64Data)` in intent URL only; `rawbt:base64,<data>` scheme unchanged.

### 3. UTF-8 text in ESC/POS bytes (secondary)

`TextEncoder` produced UTF-8 multi-byte sequences. Thermal printers expect single-byte ESC/POS.

Fix: `EscPosRenderer` now encodes text as Latin-1 single-byte (chars > 0xFF → `?`).

## What was NOT the cause

| Checked | Result |
|---------|--------|
| HTML/React sent to RawBT | No — payload is `Uint8Array` from `EscPosRenderer` |
| Printer Bluetooth connection | No — RawBT opens, printer paired |
| RawBT not installed | No — app launches |
| Install probe heuristics | Already removed in prior sprint |

## Fix Applied

1. **Intent URI:** `intent:base64,<encoded>#Intent;scheme=rawbt;package=...;end;`
2. **Scheme fallback:** `rawbt:base64,<encoded>` (official binary channel)
3. **MIME type:** `application/octet-stream` (logged, not HTML)
4. **ESC/POS validation:** payload must start with `ESC @` (0x1B 0x40)
5. **Logging:** intent URI, MIME, payload length, preview (100 chars), hex header, renderer, receipt summary
6. **PrintService:** passes Receipt Object context to adapter for audit logs

## Verification

1. Android Chrome → POS → Cetak Struk
2. Console: `[RawBT] dispatch:prepare` shows `intent:base64,` (NOT `intent:rawbt:base64`)
3. RawBT Test Print → no WRC Error
4. Blueprint BP-ECO58 prints thermal receipt
