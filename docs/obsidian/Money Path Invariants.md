---
type: invariant
tags: [security, orders, critical]
aliases: [Money Path, Pricing Rules]
---

# Money Path Invariants

**Do not regress.** Server enforces; client prices are never trusted.

## Order creation

- Orders created **only** by `POST /api/orders/create` (`server/ordersApi.ts`)
- Prices read from Firestore `products` collection at order time
- `firestore.rules` forbids client `orders` create

## Tax

- Destination-based
- Egypt + all pickups: **14% VAT included** in price (broken out on receipt)
- Exports: 0% — duties are buyer's responsibility

## Order numbers

Format: `CC######XN` (country + 6 digits + random letter + name initial)

Uniqueness: `orderNumbers/{n}` reservation via Firestore `create()`

## Payment rules

- **Shipping** → must be prepaid (no COD)
- **Cash on pickup** → removed (was Egypt IP-gated)
- **Stripe / Paymob** → webhooks + server reads order from Firestore; request bodies never carry totals
- **InstaPay / bank** → manual admin verification; see [[InstaPay]]

## Guest orders

- Lookup only via `POST /api/orders/track` (order number + email)
- Not readable via Firestore rules for guests

## Related

- [[Payments]]
- [[Order Lifecycle]]
- [[Agent Quickstart]]
- [[Firestore Rules]]
