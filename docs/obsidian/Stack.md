---
type: architecture
tags: [stack, architecture]
---

# Stack

Luxury furniture e-commerce — Egyptian business, worldwide EN + AR (RTL).

## Frontend

- React 19 + Vite + react-router 7
- Tailwind via Play CDN (`index.html`) — no build-time Tailwind
- framer-motion, Lenis (hash scroll only; native wheel scroll)
- Design: glassmorphism + gold/navy CSS vars — see `DESIGN.md`

## Backend

- Express in `server/app.ts`
- Vercel: `api/index.ts` + `api/stripe-webhook.ts`
- Local: `npm run dev` → port 3000

## Data

- **Firestore** — all app data (products, orders, users, scans metadata, `client_errors`)
- **Firebase Auth** — Google only (no email/password signup UI)
- **Cloudinary** — all files ([[Cloudinary]])

## Not used

- Firebase Storage (legacy code removed from upload paths)

## Key domains

| Domain | Implementation |
|--------|----------------|
| Payments | [[Stripe and Paymob]], [[InstaPay]] |
| Email | [[Resend Email]], [[Order Messaging]] |
| Analytics | [[GA4 Setup]] |
| 3D/AR | [[3D and AR]] |
| Errors | [[Client Errors]] |

## Related

- [[Money Path Invariants]]
- [[Environment Variables]]
- [[Home]]
