# Raafat Furniture — Ground-Up Rework Plan & Progress

Autonomous overnight build. Durable tracker (survives context compaction). Update statuses as work lands.
Design system: see DESIGN.md ("The Gilded Atelier" — champagne gold ≤10%, midnight navy, Cormorant/Inter/Cairo, soft rounded-luxe). Strategy: PRODUCT.md (register: brand, balanced).

## Stack (kept — don't rip working infra)
React 19, react-router-dom 7, Firebase (auth/firestore/storage), Cloudinary (images), Gemini (auto-translate), Vite 5 + Express 5 (`tsx server.ts`, port 3000), framer-motion, lucide-react. Tailwind via CDN (keep, wire tokens via inline `tailwind.config`).

## Integration points needing keys later (built, env-gated, graceful fallback)
- Stripe: `STRIPE_SECRET_KEY`, `VITE_STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`
- Email: `RESEND_API_KEY`, `EMAIL_FROM`
- Analytics: `VITE_GA_MEASUREMENT_ID`
- Photogrammetry reconstruction: `PHOTOGRAMMETRY_API_URL` / provider key (capture UI built; mesh gen pluggable)
- Firebase/Cloudinary/Gemini: already in .env.example

## Phases / Status  (TODO / WIP / DONE)
1. [DONE] Foundation: styles/theme.css (tokens, z-index, motion, a11y base, skip link, reduced-motion). Primitives: components/ui/{Button,Input,Card,Spinner,Badge,Modal,Toast}.tsx. Libs: lib/{format,consent,analytics,orders}.ts. Domain types added to types.ts (Order, Model3D, ModelVariant, ScanJob). Button enforces ink-on-gold.
2. [TODO] UI rework of pages/components onto primitives + tokens (Header, Hero, Home, Shop, ProductDetails, Footer, Cart, Auth, Account, Login, Onboarding, Admin).
3. [TODO] Analytics: GA4 lib, consent-gated.
4. [TODO] Stripe: client + server (checkout/payment intent), webhook w/ signature verify.
5. [TODO] Orders: types, Firestore rules, creation flow, order numbers, statuses, fulfillment (pickup/ship/custom), user history + admin management (filters, search, status history, notes, stats, CSV).
6. [TODO] Emails: elegant HTML confirmation matching on-screen receipt; Resend; server endpoint.
7. [TODO] Login rework (email/pass + Google), per design.
8. [TODO] Security audit + patch: firestore rules (orders), helmet, rate-limit, validation, CORS, webhook verify, de-hardcode admin email, secure headers.
9. [TODO] Accessibility pass: AA contrast both themes, ARIA, keyboard, landmarks, reduced-motion.
10. [TODO] 3D: `@google/model-viewer`. Admin upload GLB; Product.model3d + variants. User viewer + AR (accurate size) + material/color switcher.
11. [TODO] Guided camera scan: getUserMedia multi-angle guided capture + dimension input + upload/queue; reconstruction pluggable (honest integration point); admin review.
12. [TODO] Legal: Privacy + Cookie + Terms pages (elegant), cookie consent banner (granular: necessary/analytics/marketing), GDPR/CCPA-shaped, gates GA.
13. [TODO] Run locally, verify, screenshot.

## Key facts
- Firestore collections: users, users/{id}/store, admins/{email}, products, categories, settings, content/live. ADD: orders, scans (3D scan jobs).
- Admin gate: env `VITE_ALLOWED_ADMIN_EMAILS` + firestore `admins/{email}` + hardcoded `youssefhanna336@gmail.com` in rules (de-hardcode → move to env/custom-claims where possible; keep owner fallback).
- Product fields already present: name/category/description (LocalizedString), imageUrl, images[], price, dimensions, materials[], colors[]. ADD: model3dUrl, variants[], ar fields.
- Theme: CSS vars set on :root from constants COLOR_SCHEMES (light/dark). Keep mechanism, retint to DESIGN.md.
- i18n: TEXTS in constants.ts, t(key) in App, dynamic overrides from content/live. Arabic = Cairo, dir handling exists (currently forced ltr in App.tsx:162 — BUG: Arabic never goes RTL. Fix.).
