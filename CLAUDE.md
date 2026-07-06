# CLAUDE.md — Raafat Furniture

Luxury furniture e-commerce for an Egyptian business selling worldwide (EN + AR, RTL-aware).
Deployed on Vercel: static Vite SPA + serverless API functions.

## Stack

- React 19 + Vite + react-router 7, framer-motion, Lenis. Tailwind via Play CDN (`index.html`) — no build-time Tailwind.
- Firebase: Auth (Google + email), Firestore, Storage. Rules in `firestore.rules` / `storage.rules`.
- Express API in `server/app.ts`, shared by:
  - `server.ts` — local dev (`npm run dev`, port 3000) and self-hosting
  - `api/index.ts` + `api/stripe-webhook.ts` — Vercel serverless functions (routed in `vercel.json`)
- Payments: Stripe (international cards + Apple/Google Pay), Paymob (Egypt cards), InstaPay/bank transfer (manual reference verification), cash on pickup (Egypt-only, IP-gated).
- Email: Resend (`server/email.ts`). 3D/AR: `<model-viewer>` (GLB/USDZ, material variants). Analytics: GA4, consent-gated (`lib/analytics.ts`).

## Commands

- `npm run dev` — dev server (Express + Vite middleware) on :3000
- `npm run lint` — `tsc --noEmit` (strict, `noUnusedLocals`)
- `npm run build` — vite build to `dist/`

## Money-path invariants (do not regress)

- Orders are created ONLY by `POST /api/orders/create` (`server/ordersApi.ts`). Prices come from the Firestore `products` collection; the client's prices are never trusted. Client order creation is forbidden by `firestore.rules`.
- Tax: destination-based. Egypt (and all pickups) = 14% VAT included in the price (broken out on receipts); exports = 0%, duties are the buyer's responsibility.
- Order numbers: `CC######XN` (country + 6 digits + random letter + name initial), uniqueness guaranteed by `orderNumbers/{n}` reservation docs created with Firestore `create()`.
- Shipping orders must be prepaid (no COD). Cash on pickup only when the request IP is Egypt (`x-vercel-ip-country`).
- Stripe sessions & emails: server reads the order from Firestore; request bodies never carry totals.
- Guest order lookup only via `POST /api/orders/track` (order number + email); guest orders are not readable via Firestore rules.

## Roles

`admins/{email}` docs: `role: 'developer' | 'admin' | 'worker'`.
- developer — manages the team (writes to `admins`), everything else admins can do
- admin — catalog, orders, scans, reviews moderation, payment settings (`/admin/*`)
- worker — `/staff` only: spec-only order checklists via `/api/worker/*` (no prices, no customer data; enforced server-side, NOT just UI)

Order flow: `pending_payment → (payment_verification) → paid/confirmed → in_production → awaiting_approval → ready|shipped → completed`. Workers/admins tick the per-item `prepared` checklist; "Order complete" requires all items checked; admins release from `awaiting_approval` (notify pickup / enter tracking).

## Env (server-side names have no VITE_ prefix — never bundle secrets)

`FIREBASE_SERVICE_ACCOUNT` (required for ordering), `STRIPE_SECRET_KEY` + `STRIPE_WEBHOOK_SECRET`,
`PAYMOB_API_KEY`/`PAYMOB_INTEGRATION_ID`/`PAYMOB_IFRAME_ID`/`PAYMOB_HMAC_SECRET`,
`RESEND_API_KEY` + `EMAIL_FROM` + `CONTACT_EMAIL`, `GEMINI_API_KEY`, `SITE_URL`,
client: `VITE_FIREBASE_*`, `VITE_STRIPE_PUBLISHABLE_KEY`, `VITE_GA_MEASUREMENT_ID`, `VITE_STORE_CURRENCY`, `VITE_CLOUDINARY_*`.
See SETUP.md for the full list.

## Conventions

- i18n: every user-facing string goes through `t(key)` with an inline English fallback (`t('x') || 'Fallback'`); add both EN and AR keys in `constants.ts`. Use logical CSS props (`ps-`/`pe-`/`start`/`end`) — the site runs RTL in Arabic.
- Design: glassmorphism + gold/navy tokens (CSS vars like `--color-primary`); match `DESIGN.md` and existing `components/ui/*` primitives.
- Legal copy lives in `lib/legalContent.ts` — it still has `[BUSINESS LEGAL NAME]`-style placeholders to fill before launch.
- Ignore the stray `Raafat-Furniture-main/` and `Rafaat furniture/` folders if present locally — untracked duplicate downloads, not source.
