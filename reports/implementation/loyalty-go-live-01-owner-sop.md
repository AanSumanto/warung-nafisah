# Nafisah Rewards — Owner SOP (V1)

**Document ID:** WN-LOYALTY-GO-LIVE-01-OWNER-SOP  
**Date:** 2026-09-09  
**Audience:** Owner / admin

## Open Loyalty dashboard

1. Login as **Owner**
2. Open **Rewards** (sidebar) → `/owner/loyalty`
3. Review period totals (earned, redeemed, adjustments, outstanding, reward cost, member vs nonmember sales)

## Search member

1. Search by phone (normalized) or public member id if known
2. Open member detail: masked phone, current points, lifetime stats
3. Inspect point history (ledger) — read-only

## Verify balance

- Current points on member card should match ledger history
- If mismatch suspected: do **not** “fix” by repeated adjustments — escalate; use reconciliation diagnostic with technical support

## Manual adjustment (only when gate enabled)

**Allowed when:** clear operational error correction after investigation (e.g. documented mis-earn with evidence).

**Rules:**

- Owner only (kasir cannot adjust)
- Reason **mandatory**
- Confirm before submit
- Prefer small delta with clear reason; never invent balance via trial-and-error
- Same request must not double-apply (system idempotency); new action needs new request

**Not allowed:** arbitrary “set balance”; deleting ledger rows; adjusting to hide fraud without record.

## Negative balance meaning

After refund policy / reverse earn (or corrective negative adjustment), points may go **below zero**.

- Customer can still be attached and pay normally
- Rewards are **not** eligible until balance recovers
- This is expected policy — not a display bug

## Paid refund

**Operational paid refund is NOT available** in the ERP today. Do not promise customers an in-app refund+points reverse path. Escalate outside ERP if cash refund is handled manually; points correction only via approved adjustment SOP if gate on.

## Disable loyalty if issue occurs

1. Ask technical operator to turn off redemption env gate (if redeem issue)
2. Turn off POS member UI env gate if cashiers confused/blocked
3. Disable program (`enabled=false`) from owner loyalty program control if earning must stop
4. Turn off receipt QR / admin adjustment gates as needed

Do **not** delete members or point history.

## What to check / escalate

- Dashboard sudden spikes in earn/redeem failures
- Customer reports wrong points after pay
- Free reward without points drop
- Printer/QR customer complaints (QR can be disabled without stopping earn)

## Customer wording (approved)

- Registration: “Gratis daftar Nafisah Rewards, cukup nomor HP. Setiap belanja Rp5.000 dapat 1 poin.”
- Receipt (when QR on): “Scan QR untuk cek poin & reward.”
- Redemption: “Reward digunakan melalui kasir.”
- Do **not** advertise point expiry (none exists). Do **not** promise cash value of points.

## Privacy

Phone is identity for loyalty — not automatic marketing consent. No WhatsApp blast from this program unless separate consent exists.
