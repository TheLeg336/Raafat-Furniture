---
type: integration
tags: [email, resend]
---

# Resend Email

Transactional email provider.

## Used for

- Order confirmations
- Status updates (ready, shipped)
- Admin → customer [[Order Messaging]]
- Launch / waitlist blast (Dev tab)
- Contact form → `CONTACT_EMAIL`

## Code

- `server/email.ts` — send helpers
- `server/orderEmail.ts` — order templates + InstaPay note

## Setup

1. Verify domain in Resend
2. Set env on Vercel — [[Environment Variables]]
3. For reply threads: enable inbound → [[Order Messaging]]

## Related

- [[Order Messaging]]
- [[Deploy Checklist]]
