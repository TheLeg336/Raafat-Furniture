# Raafat Furniture — Complete Setup Checklist

Everything the site needs, in one place. Checked items were **verified live on
https://raafat-furniture.vercel.app on 2026-07-11** (by probing `/api/config`, the
deployed bundle, and driving the admin UI). Unchecked = still to do.

Run locally: `npm install && npm run dev` (http://localhost:3000). Typecheck: `npm run lint`. Build: `npm run build`.
The site runs without any keys (sample products; auth/orders disabled gracefully) — copy `.env.example` to `.env` for local features.

---

## 1. Firebase (database, login, roles)

**How it works:** Firestore holds products, categories, orders, settings, scans, and user
profiles. Firebase Auth handles Google + email sign-in. Roles come from `admins/{email}`
docs (`developer` > `admin` > `worker`). Security rules (`firestore.rules`) deny
everything not explicitly allowed; orders can only be created by the server.

- [x] **Client config** — `VITE_FIREBASE_*` env vars in Vercel. *(verified: login + catalog work live)*
- [x] **Firestore rules deployed** — `firebase deploy --only firestore:rules` after any rules change. *(verified: admin works, guests blocked from orders)*
- [x] **Developer account** — `admins/youssefhanna336@gmail.com` with `role: developer` (bootstrap email also hardcoded in rules). *(verified: /manage loads)*
- [x] **`FIREBASE_SERVICE_ACCOUNT` in Vercel** — added 2026-07-11 (one-line paste from
  `service-account.oneline.txt`). *(verified live: `/api/config` reports
  `ordersConfigured: true`; Dev-tab payment toggles now take effect at checkout.)*
  *Key hygiene: the raw key file, `.env`, and the one-line file are all gitignored —
  never commit them. The same key lives in `scan-worker/service-account.json` for the 3D worker.*
- [x] **Order pipeline** — full E2E passed **on the live site** 2026-07-11
  (`node scripts/e2e-live-order.mjs`, 11/11): guest pickup order EG259989KE → server-side
  EGP pricing → payment reference → guest tracking (wrong email rejected) → paid →
  production → checklist → awaiting approval → ready → completed → test order + number
  reservation deleted, toggles restored. Emails return `{sent:false}` until Resend is set up.
- [ ] **Add remaining team** — Admin → Team: add admins and workshop `worker` accounts (workers only see the spec-only `/workshop` checklists — no prices, no customer data; enforced server-side).

## 2. Cloudinary (all files: product photos, scan frames, 3D models)

**How it works:** the browser uploads directly to Cloudinary with an *unsigned preset*
(no server roundtrip); Firestore only stores the returned URLs. GLB models go up as
`raw` files. The server needs the API key/secret only to *delete* assets.

- [x] **Cloud name + unsigned preset** (`VITE_CLOUDINARY_CLOUD_NAME`, `VITE_CLOUDINARY_UPLOAD_PRESET`). *(verified live)*
- [x] **Preset allows Raw/GLB uploads.** *(verified: uploaded a 1.9 MB test GLB via the preset)*
- [ ] **Server delete keys** — `CLOUDINARY_API_KEY` + `CLOUDINARY_API_SECRET` in Vercel (admin "delete image/model" buttons call `/api/cloudinary/delete`). ⚠️ *Confirmed missing (your env screenshot, 2026-07-11).* Cloudinary Dashboard → API Keys.

## 3. Payments

**How it works:** checkout builds the order on the server (`/api/orders/create`) using
Firestore prices — never the browser's. Cards redirect to Stripe (international) or
Paymob (Egypt); InstaPay/bank transfer show the store's details and take a transfer
reference the team verifies manually; cash is pickup-only and geo-gated to Egypt.
Which rails appear at checkout = **env keys present** AND **Dev-tab toggle on** AND geo rules.

- [ ] **Stripe** — `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `VITE_STRIPE_PUBLISHABLE_KEY` in Vercel. ⚠️ *All three currently missing (verified: `/api/config` reports no Stripe env; no `pk_` key in the bundle).* Webhook: Stripe Dashboard → Webhooks → `https://<domain>/api/stripe/webhook`, event `checkout.session.completed`.
- [ ] **Paymob (Egypt cards)** — `PAYMOB_API_KEY`, `PAYMOB_INTEGRATION_ID`, `PAYMOB_IFRAME_ID`, `PAYMOB_HMAC_SECRET`. ⚠️ *Currently missing.* Webhook: `https://<domain>/api/paymob/webhook` (HMAC-verified).
- [x] **Dev-tab toggles** — Dev → Checkout payment options. *(verified: your saved toggles — Stripe off, Paymob off, InstaPay on, bank transfer off — display correctly; they take EFFECT only after `FIREBASE_SERVICE_ACCOUNT` is set)*
- [ ] **InstaPay address + bank details** — Admin → Team (shown to customers who pick those methods). Verify they're filled before launch.
- [x] **`SITE_URL`** in Vercel — set to `https://raafat-furniture.vercel.app` on 2026-07-11 (Production + Preview). Update it when the real domain arrives.

## 4. Email (Resend)

**How it works:** order confirmations, payment-verified notices, pickup/tracking
updates, and contact-form messages send through Resend from the server; the customer
reply-to goes to your `CONTACT_EMAIL`. Message bodies are built from the order in
Firestore — request bodies are never trusted.

- [ ] **`RESEND_API_KEY`**, **`EMAIL_FROM`** (verified domain sender), **`CONTACT_EMAIL`** in Vercel. ⚠️ *Confirmed missing (your env screenshot, 2026-07-11).* Resend → Domains: add + DNS-verify your sending domain, then create an API key.
- [ ] Optional inbound replies: `RESEND_INBOUND_SECRET` + Resend inbound webhook → `/api/email/inbound`.

## 5. 3D & AR — how the whole pipeline works

**Customer experience:** a product with a 3D model gets a "3D & AR" tab on its page —
drag to orbit, pinch to zoom. On phones, **View in your space** opens native AR
(Android Scene Viewer / iPhone Quick Look) with the piece at **true real-world size**
(from the dimensions you enter). On desktop the same button shows a QR code that hands
off to the phone. *(verified live with the test chair on Test Product 4: viewer loads,
orbit works, real-size scaling applied, AR modes + QR sheet all present)*

**Three ways to get a model onto a product (all built):**

1. **Upload a ready GLB** — Admin → product → 3D section → *Upload GLB* (files are
   auto-optimized on upload), or paste a URL into *Model URL (GLB)*. Any GLB works:
   Polycam/Luma/RealityScan phone apps, Blender exports, purchased models.
   *(verified live with chair_glb.glb)*
2. **Guided camera scan** — Admin → product → *Scan object*. On desktop it shows a QR
   that opens the scanner on your phone (`/m/scan/:id`, sign in as admin there). The
   scanner walks you through **30 manual, prompted shots**: a 12-shot circle at eye
   level, 8 high-angle, 6 low-angle, 4 close-up detail shots — you tap the shutter for
   each prompt. Then it asks for real width/height/depth (for AR scale), uploads the
   frames to Cloudinary, and queues the job in Firestore. A queued scan also has an
   **Attach GLB** button if you'd rather finish it with a file from elsewhere.
3. **The scan worker turns queued scans into models — free, on your PC** (`scan-worker/`):
   - Watches Firestore for queued scans; jobs simply wait until your PC is on.
   - Pipeline: download frames → **Meshroom** (free, uses your RTX 5070 via CUDA) →
     convert to GLB → optimize (dedup/prune/weld) → scale to the real dimensions →
     optional **USDZ** export via Blender (for iPhone AR) → upload to Cloudinary →
     mark the scan **ready** → **auto-attach to the product** the scan was started from.
   - Dashboard at **http://localhost:8787** shows pending jobs, current step, live log.

- [x] Customer 3D viewer + AR + desktop QR handoff. *(verified live)*
- [x] In-AR branding: on Android Chrome (WebXR) shoppers see a slim RAAFAT FURNITURE bar with the product name + price and an **Add to Cart** button inside the AR view; on iPhone Quick Look the USDZ gets an Apple banner (brand subtitle + Add-to-Cart tap-through). Native Scene Viewer can't host site UI — it shows a link back to the site instead.
- [x] Admin GLB upload path + Cloudinary raw storage. *(verified live)*
- [x] Guided manual scanner + scan queue. *(code shipped; do a real phone scan to try it)*
- [ ] **Scan worker one-time setup on your PC** (see `scan-worker/README.md`):
      install Node 20+, download Meshroom (alicevision.org), optionally Blender 4.x,
      put `service-account.json` + Cloudinary API keys in `scan-worker/.env`,
      then `cd scan-worker && npm install && npm start`.
- [ ] Enter real dimensions for every 3D product (makes AR true-to-size).

## 6. SEO & AI SEO

**How it works:** classic SEO (meta tags, per-page titles, JSON-LD structured data,
sitemap) gets you into Google/Bing. AI assistants (ChatGPT, Gemini, Claude, Perplexity,
DeepSeek…) recommend businesses they find in **search indexes** and **training data** —
so the site also ships `llms.txt` / `llms-full.txt` (a fact sheet written for AI
crawlers), a `<noscript>` business summary (most AI crawlers don't run JavaScript —
that's the page they actually read), and a robots.txt that **welcomes AI search and
training crawlers** on public pages while blocking admin/checkout paths.

Already live (all verified with an AI-crawler user agent):

- [x] Per-page titles + meta descriptions + canonical + hreflang (EN/AR) + OG/Twitter cards.
- [x] `og-image.png` social card (1200×630).
- [x] JSON-LD: FurnitureStore organization + all 3 showrooms + WebSite search action; per-product Product schema with price/image.
- [x] `robots.txt` allowing GPTBot, ClaudeBot, PerplexityBot, Google-Extended, CCBot, etc.
- [x] `llms.txt` + `llms-full.txt` (AI fact sheets), `sitemap.xml`, noscript summary.

**What only you can do — this is what actually makes the site show up** (it currently
has zero presence in Google, verified by searching):

- [ ] **Google Search Console** (search.google.com/search-console) — verify the site, submit `sitemap.xml`, request indexing of `/` and `/shop`. *This is the single step that gets you into Google at all.*
- [ ] **Bing Webmaster Tools** (bing.com/webmasters) — same; **Bing powers ChatGPT search**, so this directly feeds ChatGPT recommendations.
- [ ] **Google Business Profile** (business.google.com) — one profile per showroom (Cairo, Minya, New Minya) with photos, hours, phone. Biggest lever for "furniture store near me"-type answers in Google AI Overview and Gemini.
- [ ] **Custom domain** (e.g. raafatfurniture.com) — `.vercel.app` subdomains rank poorly and look untrusted to AI rankers. After buying: point it in Vercel, then update the canonical/OG URLs in `index.html`, `public/robots.txt`, `public/sitemap.xml`, `public/llms*.txt`, and set `SITE_URL`/`VITE_SITE_URL`.
- [ ] **Replace test products** with real catalog + good descriptions (AI crawlers read the catalog now; "Test Product 4 — $15" is what they currently see).
- [ ] Social profiles (Facebook/Instagram) linked both ways, and fill `sameAs: []` in the JSON-LD in `index.html` — consistent name/address/phone across the web is how AI models learn the brand is real.
- [ ] Expect **weeks, not hours**: indexing → ranking → AI answers is a pipeline; GSC + GBP + a real domain accelerate it most.

## 7. Analytics (GA4, consent-gated)

**How it works:** GA4 loads only after the visitor accepts analytics cookies (Google
Consent Mode; IP anonymised). Tracks page views, view-item, begin-checkout, purchase.

- [ ] **`VITE_GA_MEASUREMENT_ID`** in Vercel ⚠️ *currently missing (no `G-…` id in the deployed bundle)* — create a GA4 property → copy the Measurement ID → add env var → redeploy.

## 8. Legal (before launch)

**How it works:** privacy/cookies/terms live in `lib/legalContent.ts` (EN + formal
Arabic, GDPR/UK/CCPA/Egypt-PDPL aligned). Checkout and login link to them; a cookie
banner gates analytics.

- [x] Policies drafted + linked; cookie consent working; checkout agreement notice. *(live)*
- [ ] **Fill the placeholders** in `lib/legalContent.ts` (search `[`): legal name (Latin + registered Arabic), registered address, commercial registration no., tax registration no., privacy email, domain, optional warranty terms. Rule: Arabic docs carry the registered Arabic name **exactly**; English docs use transliteration + Arabic in parentheses.
- [ ] Have an Egyptian lawyer review before launch (the file is a strong draft, not legal advice).

## 9. Launch & misc

- [x] Coming-soon overlay + waitlist (Dev tab toggle; waitlist emails collected server-side). *(verified: currently OFF — site is public)*
- [x] Admin translation helper (`NVIDIA_API_KEY`). *(verified: endpoint responds as configured)*
- [ ] `VITE_STORE_CURRENCY` if you ever want a different display default (currently EGP/USD by destination).
- [ ] Optional hosted reconstruction service (`VITE_PHOTOGRAMMETRY_API_URL`) — NOT needed; the free scan-worker covers it.
- [ ] **`VITE_GEMINI_API_KEY` in Vercel is unused** — no code reads it (translation uses the server-side `NVIDIA_API_KEY`). Safe to delete from Vercel; `VITE_` vars ship to every visitor's browser, so an unused AI key there is pure exposure.

## Roles & key routes

- `developer` — everything + Team + Dev tab + error inbox. `admin` — catalog, orders, scans, reviews. `worker` — `/workshop` spec checklists only.
- Admin: `/manage` (orders, analytics, reviews, team, dev). Staff: `/workshop`. Tracking: `/track`. Mobile scan handoff: `/m/scan/:id`.

## Stripe / Paymob webhooks (once keys exist)

- Stripe: `POST https://<domain>/api/stripe/webhook` → event `checkout.session.completed` → signing secret goes in `STRIPE_WEBHOOK_SECRET`.
- Paymob: `POST https://<domain>/api/paymob/webhook` → HMAC verified via `PAYMOB_HMAC_SECRET`.

---

## Quick reference: Vercel env — confirmed against your dashboard (2026-07-11)

**Present ✓:** `VITE_FIREBASE_*` (all 6) · `VITE_CLOUDINARY_CLOUD_NAME` · `VITE_CLOUDINARY_UPLOAD_PRESET` · `NVIDIA_API_KEY` · **`FIREBASE_SERVICE_ACCOUNT`** (added 2026-07-11, live-verified) · `VITE_GEMINI_API_KEY` (unused — delete it)

**Missing — add these:**

| Env var | What breaks without it |
|---|---|
| `STRIPE_SECRET_KEY` + `STRIPE_WEBHOOK_SECRET` + `VITE_STRIPE_PUBLISHABLE_KEY` | card / Apple Pay / Google Pay |
| `PAYMOB_*` (4 vars) | Egypt card payments |
| `RESEND_API_KEY` + `EMAIL_FROM` + `CONTACT_EMAIL` | order + contact emails |
| `CLOUDINARY_API_KEY` + `CLOUDINARY_API_SECRET` | admin asset deletes |
| `VITE_GA_MEASUREMENT_ID` | analytics |

`SITE_URL` ✓ added 2026-07-11 (Production + Preview).

> The remaining vars are **secret keys** — paste them yourself in Vercel → Settings →
> Environment Variables (an assistant should never handle raw API keys). Sources:
> Stripe Dashboard → Developers → API keys; Paymob Dashboard → Settings; Resend →
> API Keys (needs your business sending domain first); Cloudinary → API Keys;
> GA4 → Admin → Data streams.

After adding env vars in Vercel you must **redeploy** for them to take effect.
