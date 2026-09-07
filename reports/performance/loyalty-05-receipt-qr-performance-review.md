# LOYALTY-05 — Performance Review

**Document ID:** WN-LOYALTY-05-PERF  
**Date:** 2026-09-07

## Impact

| Path | Notes |
|------|-------|
| Pay | Extra catalog list + per-reward menu lookup for progress after earn (same request; no frontend round-trip) |
| Receipt render | Optional loyalty lines; QR GS ( k only when URL present + supportsQr |
| Bundle | No new QR npm dependency |
| Bluetooth payload | Native QR preferred over raster; module size capped (4) |

## Assessment

Acceptable for V1. Progress service could cache catalog later if pay latency becomes an issue; not required now.
