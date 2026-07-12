# RawBT WRC Error — Verification

## Root cause

- [x] Wrong intent format `intent:rawbt:base64,...` identified
- [x] Official format `intent:base64,...` per Mike42 RawbtPrintConnector
- [x] Base64 URL encoding for `+ / =`
- [x] ESC/POS single-byte text encoding

## Payload audit

- [x] Print path uses `EscPosRenderer` only
- [x] No HTML / JSON / React in adapter
- [x] Payload validated: starts with ESC @
- [x] MIME logged as `application/octet-stream`

## Logging

- [x] Intent URI logged (truncated)
- [x] MIME type logged
- [x] Payload length + preview (100 chars)
- [x] Renderer name logged
- [x] Receipt summary logged (orderNumber, totals)

## Manual (Android)

- [ ] RawBT Test Print — no WRC Error
- [ ] POS Cetak Struk — thermal output on BP-ECO58
