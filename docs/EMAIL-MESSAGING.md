# Order email + admin↔customer messaging

## Env vars (Vercel)
| Var | Purpose |
|-----|---------|
| `RESEND_API_KEY` | Send emails |
| `EMAIL_FROM` | From header, e.g. `Raafat Furniture <orders@yourdomain.com>` |
| `EMAIL_REPLY_TO` | Base reply address, e.g. `orders@yourdomain.com` |
| `CONTACT_EMAIL` | Contact form inbox |
| `SITE_URL` | `https://raafat-furniture.vercel.app` |
| `RESEND_INBOUND_SECRET` | Optional shared secret for inbound webhook |

## What customers get
- Order confirmation (items, totals, order number) — same shape as the on-site receipt
- InstaPay/bank: email includes **transfer note** = `{ORDER_NUMBER} {Customer Name}`
- Ready / shipped status emails when admin notifies

## Admin → customer messages
1. Open an order in Admin → Orders
2. **Messages with customer** → write → Send email
3. Message is stored on the order and emailed with `Reply-To: orders+{orderId}@yourdomain.com`

## Customer replies → admin notification
1. In Resend: verify your domain, enable **Inbound** for that domain
2. Point inbound webhook to:  
   `POST https://raafat-furniture.vercel.app/api/email/inbound?secret=YOUR_RESEND_INBOUND_SECRET`
3. When a customer replies, the body is appended to `order.messages` and `unreadCustomerReplies` increments
4. Orders list shows a badge; opening the order clears it

Until Resend inbound is configured, admins can still send outbound messages; replies will only land in the mailbox (not in the admin UI).
