# Sprint 4.5.3 — Testing

## Frontend (`npm test`) — 22 passed

### Receipt Builder
- Order snapshot → Receipt object

### ESC/POS Renderer
- INIT + cut bytes

### RawBT Bridge
- `bytesToBase64`
- `buildRawBtIntentUrl`
- `isAndroidDevice`

### Printer Adapter
- Factory creates RawBT / browser adapters
- `RawBtPrinterAdapter.preview` validation
- `RawBtNotInstalledError` on failed probe
- Print dispatch when RawBT available

### PrintService
- Full print flow (mocked RawBT)
- `reprint()` calls adapter with ESC/POS bytes
- Browser preview path

## Manual (Android + RawBT + BP-ECO58)

1. Printer config shows correct readiness
2. Print from POS bottom sheet
3. Reprint from history
4. RawBT not installed error dialog

## Not tested automatically

- Physical Bluetooth print on device (requires hardware)
