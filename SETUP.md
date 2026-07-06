# Raafat Furniture — Quickstart

## Run it
```bash
npm install
npm run dev          # → http://localhost:3000
```
The site runs **without any keys** (products/categories fall back to built-in samples; auth/orders/payments are disabled gracefully). To enable real data and features, fill in `.env` (copy from `.env.example`).

> **Ordering requires `FIREBASE_SERVICE_ACCOUNT`.** Orders are created server-side (prices, tax, and unique order numbers are computed from the database, never from the browser). Without the service account, checkout returns a clear 503.

## Enable features (each is built; just add the key)
| Feature | Env vars |
|---|---|
| **Database / auth / storage** (real products, orders, login, 3D uploads) | `VITE_FIREBASE_*` |
| **Server trust: order creation, webhooks, worker API** (required for checkout) | `FIREBASE_SERVICE_ACCOUNT` (service-account JSON, one line) |
| **Cards + Apple Pay + Google Pay (international)** — Stripe | `VITE_STRIPE_PUBLISHABLE_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` |
| **Cards (Egypt)** — Paymob | `PAYMOB_API_KEY`, `PAYMOB_INTEGRATION_ID`, `PAYMOB_IFRAME_ID`, `PAYMOB_HMAC_SECRET` |
| **InstaPay / bank transfer** | No keys — set the InstaPay address & bank details in **Admin → Team → Payment settings** |
| **Emails (order confirmation, ready/shipped, contact form)** | `RESEND_API_KEY`, `EMAIL_FROM`, `CONTACT_EMAIL`, `SITE_URL` |
| **Analytics (GA4, consent-gated)** | `VITE_GA_MEASUREMENT_ID` |
| **Currency** | `VITE_STORE_CURRENCY` (e.g. `EGP`, `USD`; also set `STORE_CURRENCY` to the same value for the server) |
| **Auto 3D reconstruction from scans** | `VITE_PHOTOGRAMMETRY_API_URL` |
| **Admin translation helper (NVIDIA free API)** | `NVIDIA_API_KEY` (+ optional `NVIDIA_MODEL`, default `meta/llama-3.1-8b-instruct`) |

On **Vercel**, set the same variables in Project → Settings → Environment Variables. The API runs as serverless functions (`api/index.ts`; Stripe webhook at `api/stripe-webhook.ts`) — `vercel.json` routes `/api/*` to them and everything else to the SPA.

## Deploy the rules (Firebase)
```bash
firebase deploy --only firestore:rules,storage
```
`firestore.rules` and `storage.rules` are in the repo root.

## Stripe webhook (when ready)
Point a Stripe webhook at `POST https://<your-domain>/api/stripe/webhook` for the `checkout.session.completed` event and put its signing secret in `STRIPE_WEBHOOK_SECRET`.

## Paymob webhook (when ready)
In the Paymob dashboard set the transaction-processed callback to `POST https://<your-domain>/api/paymob/webhook` and put your HMAC secret in `PAYMOB_HMAC_SECRET`.

## Roles
Add staff in **Admin → Team** (requires developer rights — the owner account is a developer):
- **admin** — catalog, orders, approvals, scans, reviews
- **worker** — `/staff` only: spec checklists without prices or customer data

## Key routes
- `/checkout`, `/order/confirmation?order=EG123456KY`, `/track`
- `/contact`, `/faq`, `/legal/privacy` · `/legal/cookies` · `/legal/terms`
- `/account` — order history + saved items
- `/admin/orders` — pending queue (oldest first), checklist, awaiting-approval releases, tracking, payment verification, order history, CSV
- `/admin/team` — staff roles + InstaPay/bank payment settings
- `/admin/scans` — guided 3D scanning + GLB upload + attach models/materials to products
- `/staff` — workshop checklist view (workers)

## 3D models
Admins attach a `.glb` to any product at `/admin/scans` (upload or paste a URL), define material/colour options, and customers get an interactive 3D viewer with **AR at real-world scale** and live material switching on the product page. iOS AR also supports a `.usdz` (optional).
