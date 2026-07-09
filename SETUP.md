# Raafat Furniture — Quickstart

## Run it
```bash
npm install
npm run dev          # → http://localhost:3000
```
The site runs **without any keys** (products/categories fall back to built-in samples; auth/orders/payments are disabled gracefully). To enable real data and features, fill in `.env` (copy from `.env.example`).

> **Ordering requires `FIREBASE_SERVICE_ACCOUNT`.** Orders are created server-side (prices, tax, and unique order numbers are computed from the database, never from the browser). Without the service account, checkout returns a clear 503.

**Full manual checklist (Vercel, Firebase, payments, InstaPay):** see [`docs/MANUAL_SETUP.md`](docs/MANUAL_SETUP.md).

## Enable features (each is built; just add the key)
| Feature | Env vars |
|---|---|
| **Database / auth** (real products, orders, login) | `VITE_FIREBASE_*` |
| **Server trust: order creation, webhooks, worker API** (required for checkout) | `FIREBASE_SERVICE_ACCOUNT` (service-account JSON, one line) |
| **Files (images, GLB, scans)** — Cloudinary only | `VITE_CLOUDINARY_*` (+ server `CLOUDINARY_API_KEY` / `SECRET` for deletes) |
| **Cards + Apple Pay + Google Pay (international)** — Stripe | `VITE_STRIPE_PUBLISHABLE_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` |
| **Cards (Egypt)** — Paymob | `PAYMOB_API_KEY`, `PAYMOB_INTEGRATION_ID`, `PAYMOB_IFRAME_ID`, `PAYMOB_HMAC_SECRET` |
| **InstaPay / bank transfer** | No keys — set address in **Admin → Team**; toggle in **Admin → Dev** |
| **Emails** | `RESEND_API_KEY`, `EMAIL_FROM`, `CONTACT_EMAIL`, `SITE_URL` |
| **Analytics (GA4, consent-gated)** | `VITE_GA_MEASUREMENT_ID` |
| **Currency** | `VITE_STORE_CURRENCY` (also `STORE_CURRENCY` on the server) |
| **Auto 3D reconstruction from scans** | `VITE_PHOTOGRAMMETRY_API_URL` |
| **Admin translation helper** | `NVIDIA_API_KEY` (+ optional `NVIDIA_MODEL`) |

On **Vercel**, set the same variables in Project → Settings → Environment Variables, then **Redeploy**.

## Deploy Firestore rules
Paste `firestore.rules` in Firebase Console → Firestore → Rules → Publish.  
**Do not** deploy Storage rules — files use Cloudinary, not Firebase Storage.

## Stripe / Paymob webhooks
- Stripe: `POST https://<domain>/api/stripe/webhook` → `checkout.session.completed` → `STRIPE_WEBHOOK_SECRET`
- Paymob: `POST https://<domain>/api/paymob/webhook` → `PAYMOB_HMAC_SECRET`

## Roles
**Admin → Team:** `admin` (catalog/orders), `worker` (`/staff` only, no prices/PII), `developer` (admin + Dev tab).

## Key routes
`/checkout`, `/order/confirmation`, `/track`, `/admin/orders`, `/admin/team`, `/admin/dev`, `/staff`
