# RawBT WRC Error — Test Results

## Automated (frontend)

- Intent URL uses `intent:base64,` prefix (not `intent:rawbt:base64`)
- Base64 special chars URL-encoded in intent
- ESC/POS bytes start with 0x1B 0x40
- `dispatchRawBtPrint` receives `Uint8Array`, not string/HTML
- 30+ Vitest printing tests PASS

## Manual required

Physical device: RawBT Test Print + POS print on Blueprint BP-ECO58.

See `reports/printing/wrc-error-rca.md`.
