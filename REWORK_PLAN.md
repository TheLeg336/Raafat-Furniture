# Raafat Furniture — Ground-Up Rework: Status & Handoff

Autonomous overnight build. The site **builds clean** (`npx tsc --noEmit` + `vite build` both pass) and **runs locally** (`npm run dev` → http://localhost:3000). Design system: DESIGN.md ("The Gilded Atelier"). Strategy: PRODUCT.md.

## Phase status
1. [DONE] Foundation — `styles/theme.css` tokens (radii, shadows, motion, z-index, a11y base, skip link, reduced-motion). Primitives `components/ui/{Button,Input,Card,Spinner,Badge,Modal,Toast}`. Libs `lib/{format,consent,analytics,orders,checkout,scan}`. Domain types (Order, Model3D, ModelVariant, ScanJob). **White-on-gold AA bug fixed** at the primitive level + Hero/Cart/AuthModal.
2. [PARTIAL] UI rework — reworked onto the design system: ProductDetails, Login, UserAccount, CartDrawer, AuthModal, Hero (contrast), Footer, + all new pages. **Not yet reworked (still functional, on the old styling):** Shop.tsx (928 lines), Home/ProductSection/VisitUsSection, Header polish, Admin.tsx main catalog dashboard. These work; they're the next visual pass.
3. [DONE] Analytics — GA4 (`lib/analytics.ts`), Consent Mode v2, IP-anonymised, gated on cookie consent, page-view tracking on route change. Needs `VITE_GA_MEASUREMENT_ID`.
4. [DONE] Stripe — client `lib/checkout.ts` + server checkout session + **signature-verified webhook**. Needs `STRIPE_SECRET_KEY`, `VITE_STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`.
5. [DONE] Orders — types, Firestore rules, `lib/orders.ts`, checkout flow (pickup/ship/custom; card/cash/COD/bank), order numbers (RF-XXXXXX), status workflow + history, **admin order management** (`/admin/orders`: stats, search, filters, status timeline, internal notes, CSV), **user order history** (`/account`), confirmation page.
6. [DONE] Emails — elegant brand HTML confirmation (`server/orderEmail.ts`) matching the on-screen receipt; Resend sender (`server/email.ts`); `/api/email/order-confirmation`. Needs `RESEND_API_KEY` + `EMAIL_FROM`.
7. [DONE] Login rework — cleaner brand card (dropped decorative glass + 3 infinite blobs), primitives, ink-on-gold, friendly auth errors, signup query support, a11y.
8. [DONE] Security — see SECURITY section below.
9. [PARTIAL] Accessibility — skip link, visible focus rings, reduced-motion safety net + per-animation intent, ARIA on primitives/modals/toasts, **RTL bug fixed** (Arabic was forced LTR), logical props. Not every legacy component was line-audited.
10. [DONE] 3D + AR — `<model-viewer>` wrapper (`components/ModelViewer3D.tsx`): orbit, AR (WebXR/Scene Viewer/Quick Look) at real-world scale, **live material/colour switching**. Integrated into ProductDetails (3D/Photos toggle). Admin attaches models + variant lists at `/admin/scans`.
11. [DONE*] Guided camera scan — `components/scan/GuidedScanner.tsx`: environment camera, **device-heading-gated 360° auto-capture** with live progress ring (manual shutter fallback), dimension input, frame upload to Firebase Storage, ScanJob queue, admin review at `/admin/scans`. *Mesh reconstruction is the one genuinely external piece (see note).
12. [DONE] Legal — Privacy + Cookie + Terms (`lib/legalContent.ts` + `pages/Legal.tsx`), GDPR/UK-GDPR/CCPA-shaped; **cookie consent banner** (necessary/analytics/marketing, granular, gates GA); footer links + "Cookie settings".
13. [DONE] Runs locally — dev server on :3000, all routes/modules compile (200).

## What still needs YOUR keys/accounts (all built, env-gated, graceful fallback)
Copy `.env.example` → `.env` and fill in. Without them the site runs; those features no-op cleanly.
- Firebase (`VITE_FIREBASE_*`) — **most important**; without it products/orders/auth use fallbacks/are disabled.
- `VITE_STRIPE_PUBLISHABLE_KEY` + `STRIPE_SECRET_KEY` + `STRIPE_WEBHOOK_SECRET` — card payments.
- `RESEND_API_KEY` + `EMAIL_FROM` — confirmation emails.
- `VITE_GA_MEASUREMENT_ID` — analytics.
- `FIREBASE_SERVICE_ACCOUNT` (or `GOOGLE_APPLICATION_CREDENTIALS`) — server-side trust (secure Stripe webhook order updates + price re-validation).
- `VITE_PHOTOGRAMMETRY_API_URL` — auto mesh reconstruction (see below).
- `VITE_STORE_CURRENCY` — defaults USD; set EGP etc.

## The one honest external dependency: scan → 3D mesh
Real photogrammetry (multi-photo → textured mesh) cannot run in-browser to production quality. The **entire capture + upload + queue + admin pipeline is built**; the reconstruction step is pluggable:
- Set `VITE_PHOTOGRAMMETRY_API_URL` to a service (self-hosted COLMAP/Meshroom, Luma AI, Polycam API…) that takes `{scanId, frameUrls, dimensions}` and writes a GLB url back to the scan doc, OR
- Reconstruct elsewhere and **upload the finished GLB** at `/admin/scans` → attach to a product. The viewer/AR/material-switching all work regardless of how the GLB was made.

## SECURITY (audit + hardening done; follow-ups noted)
Done: Firestore rules for orders (validated create, admin-only status updates) + scans (admin-only) + storage.rules (GLB public-read/admin-write, scan frames admin-only); server security headers (nosniff, frame-options, referrer-policy, permissions-policy, COOP, HSTS in prod); in-memory per-IP rate limiting on all `/api/*`; **Stripe webhook signature verification**; Cloudinary-delete gated behind verified admin when Firebase Admin is configured; HTML-escaped emails; no secrets logged.
Follow-ups before production (documented, need keys to close):
- **Guest order reads** are world-readable by random order number (rules note). Tighten to a Cloud Function lookup before launch.
- **Stripe line items** are client-trusted unless `FIREBASE_SERVICE_ACCOUNT` is set (then server re-reads the order). Set it for production.
- **`/api/email/order-confirmation`** trusts its body. With Firebase Admin, verify the order exists server-side before sending.

## i18n note
~80 new user-facing strings use `t('key') || 'English fallback'`, so English is complete; **Arabic shows English for the new strings** until keys are added to `constants.ts` TEXTS (en+ar). RTL layout itself is fixed and works.

## Perf note
Single JS bundle ~881KB (gzip 245KB) — Firebase + framer-motion. Code-split with dynamic `import()` / manualChunks when convenient.
