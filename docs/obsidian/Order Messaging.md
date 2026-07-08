---
type: integration
tags: [email, resend, messaging]
aliases: [Order Messaging, Email Messaging]
---

# Order Messaging

Admin ↔ customer email threads on orders.

## Env

See [[Environment Variables]]:

- `RESEND_API_KEY`, `EMAIL_FROM`, `EMAIL_REPLY_TO`, `SITE_URL`
- `RESEND_INBOUND_SECRET` (optional)

Full setup: repo `docs/EMAIL-MESSAGING.md`

## Admin → customer

1. Admin → Orders → open order
2. **Messages with customer** → Send
3. Stored on `order.messages` + emailed
4. `Reply-To: orders+{orderId}@yourdomain.com`

## Customer → admin

1. Resend inbound on verified domain
2. Webhook: `POST /api/email/inbound?secret=...`
3. Appends to `order.messages`, increments `unreadCustomerReplies`
4. Badge on orders list; cleared when order opened

Without inbound: outbound works; replies stay in mailbox only.

## Status emails

- Order confirmation (all methods)
- InstaPay note in confirmation — [[InstaPay]]
- Ready / shipped when admin notifies

## Related

- [[Resend Email]]
- [[Order Lifecycle]]
- [[InstaPay]]
