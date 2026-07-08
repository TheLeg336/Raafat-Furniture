# Raafat Furniture — agent memory

## Live site
- URL: https://raafat-furniture.vercel.app
- Stack: Vite SPA + Vercel serverless (`api/`), Firebase, Stripe/Paymob/InstaPay

## Money path (do not regress)
- Orders only via `POST /api/orders/create` — server prices from Firestore
- InstaPay / bank: customer puts `{orderNumber} {fullName}` in transfer note; admin verifies manually
- Cash on pickup: removed
- Guest track: `POST /api/orders/track` only

## Messaging
- Admin → customer: `POST /api/admin/orders/:id/message` + Resend when configured
- Customer replies: Resend inbound → `POST /api/email/inbound` → `unreadCustomerReplies` badge on admin orders
- Docs: `docs/EMAIL-MESSAGING.md`

## Analytics
- Consent-gated GA4 via `VITE_GA_MEASUREMENT_ID` — see `docs/GA4-SETUP.md`
- Events: page_view, view_item, add_to_cart, begin_checkout, purchase
- Admin Analytics page aggregates Firestore orders (works without GA)

## 3D / AR
- `ModelViewer3D` applies `model.variants` (colorHex / gltfVariant / materialName)
- Product color/material selectors sync to preferred variant when labels match

## Env still needed from owner
- `VITE_GA_MEASUREMENT_ID`
- `RESEND_API_KEY`, `EMAIL_FROM`, `EMAIL_REPLY_TO`, `CONTACT_EMAIL`, `SITE_URL`
- Legal placeholders in `lib/legalContent.ts`
