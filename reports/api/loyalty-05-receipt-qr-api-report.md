# LOYALTY-05 — API Report

**Document ID:** WN-LOYALTY-05-API  
**Date:** 2026-09-07

## Pay response loyalty (extended)

When awarded:

```json
{
  "memberAttached": true,
  "awarded": true,
  "phoneMasked": "08******123",
  "name": "Aan",
  "publicMemberId": "<opaque>",
  "pointsEarned": 4,
  "balanceAfter": 27,
  "receiptProgress": {
    "eligibleRewardCount": 1,
    "hasRedeemableThreshold": true,
    "nextReward": {
      "rewardCode": "REWARD_NASI_PUTIH",
      "name": "Nasi Putih",
      "pointsRequired": 30,
      "pointsRemaining": 3
    },
    "progressMessage": "Tinggal 3 poin lagi untuk Gratis Nasi Putih"
  },
  "memberPortalUrl": null
}
```

`memberPortalUrl` only when `LOYALTY_RECEIPT_QR_ENABLED=true` and `PUBLIC_APP_URL` set.

## Order GET / list

`loyalty` reconstructed from immutable `order.loyaltyReceipt` for reprint (no re-earn).

## GET `/api/v1/loyalty/pos-ui`

```json
{ "memberUiEnabled": false, "receiptQrEnabled": false }
```

## Not introduced

- Public portal routes
- Public token lookup API
- Redemption APIs
