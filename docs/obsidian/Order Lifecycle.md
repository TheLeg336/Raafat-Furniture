---
type: feature
tags: [orders, workflow]
---

# Order Lifecycle

## Status flow

```
pending_payment
  → (payment_verification for InstaPay/bank)
  → paid / confirmed
  → in_production
  → awaiting_approval
  → ready | shipped
  → completed
```

## Checklist (production)

- Per-item `prepared` flags on order items
- Workers/admins tick checklist in admin or staff UI
- "Order complete" requires **all** items prepared
- Admin releases from `awaiting_approval`:
  - Pickup → notify ready
  - Shipping → enter tracking, mark shipped

## Admin tools

- **Orders** — status, payment verify (InstaPay/bank), [[Order Messaging]]
- **Analytics** — sales aggregates from Firestore orders

## Customer visibility

- Signed-in: account orders
- Guest: [[Payments]] confirmation + `/track` (order # + email)

## Related

- [[Payments]]
- [[InstaPay]]
- [[Order Messaging]]
- [[Money Path Invariants]]
