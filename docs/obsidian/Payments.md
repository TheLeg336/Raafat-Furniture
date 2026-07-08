---
type: feature
tags: [payments]
---

# Payments

## Methods

| Method | Region | Verification |
|--------|--------|--------------|
| Stripe | International | Webhook auto |
| Paymob | Egypt cards | Webhook auto |
| InstaPay | Egypt | Manual admin — [[InstaPay]] |
| Bank transfer | — | Manual admin |

## Removed

- Cash on pickup (was Egypt IP-gated)

## Server flow

1. Client calls `POST /api/orders/create`
2. Server prices from Firestore `products`
3. Redirect to Stripe/Paymob OR confirmation for manual methods

## Billing address

- Required for card payments (Stripe/Paymob)
- Pickup: nearest showroom sort (`lib/pickupLocations.ts`)

## Related

- [[Money Path Invariants]]
- [[InstaPay]]
- [[Stripe and Paymob]]
- [[Order Lifecycle]]
