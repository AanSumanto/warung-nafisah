# LOYALTY-07 — Security Review

- Cashier auth required for reward set/list/pay  
- No public redeem; portal unchanged GET-only  
- Client sends only `rewardCode` — points/HPP/price server-authoritative  
- Menu availability + balance revalidated at pay  
- Atomic `currentPoints: { $gte }` prevents negative balance  
- Blocked/missing + redemption intent → pay rejected (no free item)  
- `LOYALTY_REDEMPTION_ENABLED` enforced backend-side  
- Idempotency key `LOYALTY:REDEEM_REWARD:<orderId>`
