# Raafat Furniture — Quickstart

## Run it
```bash
npm install
npm run dev          # → http://localhost:3000
```
The site runs **without any keys** (products/categories fall back to built-in samples; auth/orders/payments are disabled gracefully). To enable real data and features, fill in `.env` (copy from `.env.example`).

## Enable features (each is built; just add the key)
| Feature | Env vars |
|---|---|
| **Database / auth / storage** (needed for real products, orders, login, 3D uploads) | `VITE_FIREBASE_*` |
| **Card payments** | `VITE_STRIPE_PUBLISHABLE_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` |
| **Confirmation emails** | `RESEND_API_KEY`, `EMAIL_FROM` |
| **Analytics** | `VITE_GA_MEASUREMENT_ID` |
| **Secure server (Stripe webhook writes, price re-validation)** | `FIREBASE_SERVICE_ACCOUNT` (service-account JSON, one line) |
| **Auto 3D reconstruction from scans** | `VITE_PHOTOGRAMMETRY_API_URL` |
| **Currency** | `VITE_STORE_CURRENCY` (default USD) |

## Deploy the rules (Firebase)
```bash
firebase deploy --only firestore:rules,storage
```
`firestore.rules` and `storage.rules` are in the repo root.

## Stripe webhook (when ready)
Point a Stripe webhook at `POST /api/stripe/webhook` for the `checkout.session.completed` event and put its signing secret in `STRIPE_WEBHOOK_SECRET`.

## Key new routes
- `/checkout`, `/order/confirmation?order=RF-XXXXXX`
- `/account` — order history
- `/admin/orders` — order management (stats, filters, status, notes, CSV)
- `/admin/scans` — guided 3D scanning + GLB upload + attach models/materials to products
- `/legal/privacy` · `/legal/cookies` · `/legal/terms`

## What's done vs. needs you
See **REWORK_PLAN.md** for the full status, the security follow-ups, and the one genuinely external piece (photogrammetry mesh compute — the capture/upload/queue pipeline is built; plug in a reconstruction service or upload finished GLBs).

## 3D models
Admins attach a `.glb` to any product at `/admin/scans` (upload or paste a URL), define material/colour options, and customers get an interactive 3D viewer with **AR at real-world scale** and live material switching on the product page. iOS AR also supports a `.usdz` (optional).
