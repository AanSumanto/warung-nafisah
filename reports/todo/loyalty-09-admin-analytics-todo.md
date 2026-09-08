# LOYALTY-09 — TODO / Carry-forward

**Document ID:** WN-LOYALTY-09-TODO  
**Date:** 2026-09-08

## Still open / platform gaps

1. No operational paid refund/void / payment reverse  
2. Draft cancel domain unwired  
3. PHYSICAL_BP_ECO58_QR_VERIFICATION = PENDING  
4. Public rate limiter in-memory (multi-instance)  
5. Production trust-proxy hop verification  
6. POINT_EXPIRY_DECISION = OPEN  
7. TOTAL_SPENDING / TRANSACTION_COUNT refund semantics N/A until refund exists  
8. PARTIAL_REFUND_LOYALTY_POLICY = OPEN if partial refunds appear  

## Separate production activation checklist (later)

Do **not** auto-enable:

- program.enabled  
- LOYALTY_POS_UI_ENABLED  
- LOYALTY_REDEMPTION_ENABLED  
- LOYALTY_RECEIPT_QR_ENABLED  
- LOYALTY_ADMIN_ADJUSTMENT_ENABLED  

## Optional polish

- Custom date picker UI (API already supports `preset=custom&from&to`)  
- Drill-down list of negative-balance members  
- Materialized daily analytics if volume grows  
