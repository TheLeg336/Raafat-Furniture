---
type: integration
tags: [stripe, paymob, payments]
---

# Stripe and Paymob

## Stripe

- International cards + Apple Pay / Google Pay
- Client: `VITE_STRIPE_PUBLISHABLE_KEY`
- Server: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`
- Webhook: `api/stripe-webhook.ts`
- Checkout session reads order from Firestore — never client totals

## Paymob

- Egypt card payments
- `PAYMOB_API_KEY`, `PAYMOB_INTEGRATION_ID`, `PAYMOB_IFRAME_ID`, `PAYMOB_HMAC_SECRET`
- Routes in `server/paymob.ts`

## Config endpoint

`GET /api/config` returns which card provider is available.

## Related

- [[Payments]]
- [[Money Path Invariants]]
- [[Environment Variables]]
