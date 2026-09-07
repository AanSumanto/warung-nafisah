# LOYALTY-07 — Database Report

- Ledger metadata → Mixed (earn + redeem shapes)  
- Order items: optional `lineKind`, `rewardCode`, `rewardHppSnapshot`, `pointsUsed`  
- Order: `loyaltyRedemptionIntent` (draft), `loyaltyReceipt.redemption` (paid)  
- Customer: `applyRedeemMutation` guarded `$inc`  
- No syncIndexes / dropIndexes  
- Idempotency unique index reused
