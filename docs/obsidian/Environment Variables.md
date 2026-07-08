---
type: operations
tags: [env, vercel, configuration]
---

# Environment Variables

Source of truth: `.env.example` in repo.

## Client (VITE_ prefix — bundled)

| Variable | Purpose |
|----------|---------|
| `VITE_FIREBASE_*` | Firebase client SDK |
| `VITE_CLOUDINARY_CLOUD_NAME` | [[Cloudinary]] |
| `VITE_CLOUDINARY_UPLOAD_PRESET` | Unsigned upload preset |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Stripe checkout |
| `VITE_GA_MEASUREMENT_ID` | [[GA4 Setup]] |
| `VITE_STORE_CURRENCY` | Display currency (e.g. USD) |
| `VITE_ALLOWED_ADMIN_EMAILS` | Legacy allowlist hint |

## Server (no VITE_ — secrets)

| Variable | Purpose |
|----------|---------|
| `FIREBASE_SERVICE_ACCOUNT` | Order API, webhooks |
| `STRIPE_SECRET_KEY` | [[Stripe and Paymob]] |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook |
| `PAYMOB_*` | Egypt cards |
| `RESEND_API_KEY` | [[Resend Email]] |
| `EMAIL_FROM` | Outbound from address |
| `EMAIL_REPLY_TO` | Order thread replies |
| `CONTACT_EMAIL` | Contact form |
| `SITE_URL` | `https://raafat-furniture.vercel.app` |
| `RESEND_INBOUND_SECRET` | Inbound webhook auth |
| `CLOUDINARY_API_KEY` / `SECRET` | Delete API only |
| `GEMINI_API_KEY` | Admin translate proxy |

## Optional

| Variable | Purpose |
|----------|---------|
| `VITE_PHOTOGRAMMETRY_API_URL` | Scan → GLB reconstruction |

## Related

- [[Deploy Checklist]]
- [[Cloudinary]]
- [[GA4 Setup]]
- [[Resend Email]]
