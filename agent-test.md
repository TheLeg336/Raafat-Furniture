# Raafat Furniture — Full QA Test Spec (for Cursor Composer 2.5 + Playwright MCP)

You are an autonomous QA agent testing an e-commerce website end to end using the **Playwright MCP**. Your job is to exercise **every page, feature, and interaction** described below, in a real browser, and produce a **prioritized bug report** — from tiny visual glitches to serious functional/security problems.

This document explains what every part of the site is and **exactly how it is supposed to behave**, so you can compare reality against intent and flag any deviation.

---

## 0. How to run & ground rules

**Start the app**
```bash
npm install
npm run dev        # serves on http://localhost:3000
```
Base URL: `http://localhost:3000`.

**Environment reality (important):**
- If `FIREBASE_SERVICE_ACCOUNT` is **not** configured, order creation returns HTTP 503 by design. In that case, do **not** report "checkout broken" — instead verify the site **fails gracefully** (shows a clear error toast, doesn't crash, doesn't lose the cart).
- If Firebase client keys are absent, products fall back to built-in sample data and auth/orders are disabled gracefully. Test the UI/UX regardless; note which flows need real config to complete.
- Some areas need a logged-in **admin** or **worker** account (the `admins/{email}` collection). If you can't log in, still verify these routes **redirect unauthenticated users away** (to `/login` or `/`).

**For every page, always check:**
- No JavaScript errors or unhandled promise rejections in the console.
- No failed network requests (except the known-503 order endpoint when unconfigured).
- **No horizontal scrolling** at mobile width.
- All images load (no broken/placeholder icons).
- Interactive elements are keyboard-reachable and have visible focus.
- Buttons/links have accessible names (aria-label or text).

**Test at three viewports on every page:** mobile `375×812`, tablet `768×1024`, desktop `1440×900`.

**Test in both languages:** English (LTR) and Arabic (RTL) — see §2.

**Report format:** for each finding give — Severity (Blocker / Major / Minor / Polish), Page/Component, What's wrong, Steps to reproduce, Expected vs Actual, Screenshot.

---

## 1. Global shell (header, footer, providers)

### Header (`components/Header.tsx`)
- Sticky top bar. On scroll **down** it hides; on scroll **up** it reappears (smooth transform).
- **Logo** (center on desktop) → clicking goes home; on the home page it smooth-scrolls to top.
- **Nav links:** Home, Shop, About, **FAQ**, **Contact**.
  - "Shop" and "About" are hash links to home sections (`/#shop`, `/#visit-us`) — clicking from another page navigates home then scrolls.
  - **FAQ → `/faq`** and **Contact → `/contact`** must open the real dedicated pages (NOT a footer anchor). ← verify this specifically.
- **Account icon** → `/login` if signed out; `/account` if a customer; `/admin` if admin; `/staff` if worker.
- **Cart icon** → opens the cart drawer; shows a badge with item count that animates when it changes.
- **Language toggle (EN / العربية)** → switches the whole site language and, for Arabic, flips layout to RTL.
- **Currency toggle (EGP / USD)** → switches displayed prices site-wide; the active one is highlighted; choice persists across reloads.
- **Theme toggle** → light/dark; persists.
- **Mobile:** a hamburger opens a full menu; it must **close when a link is tapped** and when the backdrop is tapped; in Arabic it must open from the correct (right) side.

### Footer (`components/Footer.tsx`)
- Branch cards (Cairo, Minya, New Minya) with addresses; phone number (click-to-call).
- Links: **Contact, FAQ, Track order, Privacy Policy, Cookie Policy, Terms**, and a **Cookie settings** button that reopens the consent modal.
- All links must resolve to real pages (no 404, no dead anchors).

### Cookie consent (`components/CookieConsent.tsx`)
- On first visit a banner appears: **Accept all / Reject non-essential / Customize**.
- "Customize" opens a modal with toggles: Necessary (locked on), Analytics, Marketing.
- Choice persists (no re-prompt on reload). Analytics only loads **after** consent (verify Google Analytics network calls do NOT fire before accepting).

---

## 2. Bilingual + RTL (do this across the whole site)

- Switch to **Arabic**. The `<html dir>` must become `rtl` and `lang="ar"`.
- Layout mirrors: navigation, cart drawer (opens from the right), product cards, form fields, icons/arrows.
- **No English text leaks** in Arabic mode on customer-facing pages (watch placeholders and buttons especially — search box, name fields, payment notes).
- Numbers/prices format correctly (Arabic locale).
- Switch back to English and confirm everything restores.
- **Catch:** any element still left-aligned, any arrow pointing the wrong way, any hardcoded English string, any layout overlapping in RTL.

---

## 3. Home (`/`)
- **Hero:** background image loads (if no admin image set, a branded fallback SVG shows — never a broken image or random stock photo). A **search box** — typing a query and submitting goes to `/shop?q=...`. Search placeholder is translated in Arabic.
- **Featured products** section renders product cards.
- **Visit Us** section with branch info.
- Smooth scrolling feels intact; scroll-to-section from nav works.
- **SEO:** page `<title>` mentions Raafat Furniture + Luxury Furniture; a meta description exists; the static JSON-LD `<script type="application/ld+json">` is present in the page source.

---

## 4. Shop (`/shop`)
- Product grid; each card shows image, name, **price in the active currency**, category, and colour dots.
- **Search** (`?q=`) filters by name; clearing shows all.
- **Filters** (open the filters panel): price range slider (label shows the active currency, not always USD), colour filter (derived from real product colours), category.
- **Sort:** relevance, price low→high, price high→low. Price sorting must respect the active currency.
- **Currency:** toggle EGP/USD in the header and confirm all shop prices change.
- **Wishlist heart** on a card toggles saved state (filled when saved).
- **Quick add-to-cart** button adds the item (cart badge increments); the added price should match the shown price.
- Empty state: a search with no matches shows a friendly "no results", not a blank page.
- **SEO:** title mentions "Shop … Raafat Furniture"; canonical points to `/shop`.

---

## 5. Product details (`/product/:id`)
- **Media:** a photo carousel (swipe/prev-next, dot indicators) and, if the product has a 3D model, a **3D viewer**.
- **3D viewer (`<model-viewer>`):** drag to rotate, scroll/pinch to zoom. On mobile, a **"View in your space" / AR** button appears. (Playwright can't complete AR, but verify the button exists on mobile viewport and the 3D canvas renders without errors.)
- **Colour / material variants:** selecting a swatch updates the selection and (for 3D products) the model's material live.
- **Custom dimensions:** if enabled for the product, a field accepts custom sizes.
- **Price** shows in the active currency; "price on request" if none set.
- **Add to cart:** respects selected colour/material/dimensions; shows an "Added" confirmation; cart badge increments.
- **Wishlist** button toggles saved state.
- **Reviews section:** shows approved reviews + average stars; a signed-in customer can submit a star rating + text (it becomes "awaiting approval", not shown publicly until an admin approves). Signed-out users see a prompt to sign in.
- **SEO:** `<title>` is the product name; a **Product JSON-LD** script is injected with name, image, price, currency, availability. ← verify in page source after navigation.

---

## 6. Cart drawer (`components/CartDrawer.tsx`)
- Opens from the header cart icon; **from the right** in English, **mirrored** in Arabic.
- Lists items with image, name, options, unit price (active currency), quantity controls (+/−), and remove.
- **Subtotal** updates live and is in the active currency; switching the header currency re-prices the cart.
- "Save for later" moves an item to a separate list; "move to cart" returns it.
- Product names are start-aligned (RTL-correct).
- **Checkout** button → `/checkout`. Closing (X or backdrop) works.

---

## 7. Checkout (`/checkout`)
- Empty cart → shows an empty state with a "continue shopping" link.
- **Fulfillment:** Pickup / Delivery / Custom cards.
  - Delivery shows a note that it's prepaid; Custom shows a deposit/non-returnable note.
- **Contact + address:** name, email, phone always required; **address (street, city, country) is always required** (not only for delivery). Country is a searchable dropdown.
- **Payment options change by context:**
  - Card option appears only if a processor is configured.
  - **InstaPay** appears (Egypt/most cases).
  - **Cash on pickup** appears **only** when fulfillment ≠ delivery AND the visitor is in Egypt (IP-gated) — verify it's hidden for delivery.
  - **Bank transfer** always available.
- **Currency & tax preview:** the order summary shows the **charge currency locked to destination** — EGP for Egypt/pickup (with a "VAT 14% included" line), USD for exports (with "0% (export)" and a duties note). Change the country to a non-Egypt one on a delivery order and confirm the currency and tax line change.
- **Validation:** the submit button is disabled until required fields are valid (bad email, short phone, missing address).
- **Place order:** with a configured backend it creates the order and lands on `/order/confirmation?order=...`. **Without** `FIREBASE_SERVICE_ACCOUNT` it should show a clear error toast (503) and NOT crash or clear the cart silently.
- **Security check (describe, don't exploit):** prices/tax are computed server-side; the client cannot set them. Confirm the request body to `/api/orders/create` sends product IDs + quantities, **not trusted prices**.

---

## 8. Order confirmation (`/order/confirmation?order=...`)
- Shows a **green circle + checkmark**, the **order number** prominently, and a full **receipt** (items, subtotal, VAT-included line for Egypt or export note, total in the order currency).
- **Order number format:** `CC######XN` — 2-letter country + 6 digits + a letter + a name initial (e.g. `EG482913KY`).
- If arriving without a remembered email (e.g. fresh browser), it prompts for the email used on the order, then looks it up.
- **InstaPay/bank orders** show a payment panel: the store's InstaPay address/bank details, the amount, and a field to submit the **transfer reference** → after submitting, status becomes "verifying payment".
- Tracking number appears here once an admin adds one.

---

## 9. Track order (`/track`)
- Form: order number + email → shows a **status timeline** (Confirmed → Preparing → Ready → Shipped → Completed) with the reached steps highlighted.
- Wrong number/email → a clear "no order matches" message (no crash).
- Shipped orders show the tracking number.

---

## 10. Contact (`/contact`)
- WhatsApp card (opens `wa.me` link), phone (click-to-call), showroom note.
- Form: name, email, message; validation on empty/invalid; on submit shows a success state. (Backend emails require `RESEND_API_KEY`; without it, verify graceful handling.)
- **SEO:** title mentions Contact; description present.

---

## 11. FAQ (`/faq`)
- Accordion of questions; clicking expands/collapses; one open by default.
- Content covers delivery, shipping, payments, returns, custom orders, AR, care, tracking.
- **SEO:** an **FAQPage JSON-LD** script is present listing questions + answers.
- Arabic: questions and answers are in Arabic.

---

## 12. Legal (`/legal/privacy`, `/legal/cookies`, `/legal/terms`)
- Three documents with a tab nav to switch; "last updated" date; readable sections.
- **Known pending:** the docs currently contain placeholders like `[BUSINESS LEGAL NAME]` and `[DOMAIN]`. **Flag every visible placeholder** — these must be filled before launch.
- **SEO:** each has its own title/description.

---

## 13. Auth & account
- **Login (`/login`):** Google sign-in + email/password (create account / sign in toggle). Validation on bad inputs.
- **Onboarding (`/onboarding`):** after first sign-up, asks first/last name; placeholders are translated in Arabic. Redirects to account when done.
- **Account (`/account`):** profile, **order history** (status badges, click to view), **saved items (wishlist)** grid, sign out. Admins are redirected to `/admin`.
- Signed-out users hitting `/account` → redirected to `/login`.

---

## 14. Admin (needs an admin account) — `/admin/*`
- **Access control:** signed-out or non-admin users are redirected away from every `/admin` route. ← verify.
- **Catalog (`/admin`):** create/edit/archive/delete listings. Product form has **two price fields (EGP and USD)**, name/description in EN + AR, an **Auto-Translate** button (fills the missing language via NVIDIA AI — needs `NVIDIA_API_KEY`), image upload, materials/colours/dimensions, and a "custom dimensions" toggle.
- **Orders (`/admin/orders`):**
  - **Pending** vs **Order history** toggle. Pending list is **oldest first**.
  - Stats cards (open, awaiting approval, revenue, completed).
  - Open an order: contact info, items, totals with VAT line.
  - **Per-item preparation checklist** that **auto-saves** and syncs; **"Order complete"** is disabled until every item is checked → moves order to **Awaiting Approval**.
  - **Awaiting Approval:** for pickup → "Notify — ready for pickup"; for delivery → tracking number input + "Mark shipped".
  - **Payment verification** panel for InstaPay/bank orders (shows the customer's reference; "Confirm payment received").
  - Status history timeline; internal notes; CSV export.
- **Team (`/admin/team`):** add admins/workers by email with a role; remove them; **Payment settings** (InstaPay address + bank details). Only developers can actually save team changes.
- **Scans & 3D (`/admin/scans`):** upload a `.glb`/`.usdz`, or run the **guided camera scanner**; attach a model + material options to a product.

---

## 15. Staff / workshop (needs a worker account) — `/staff`
- Shows **active orders, oldest first**, as spec checklists: item, colour, material, dimensions, quantity — **no prices, no customer details** (verify neither appears anywhere, including network responses).
- Ticking items auto-saves and syncs.
- **"Order complete"** is disabled until all items are checked; clicking it shows a **success popup that auto-closes after ~3 seconds** (or via an X), and the order leaves the list.
- Non-worker/non-admin users are redirected away.

---

## 16. SEO / AI-discoverability files (fetch directly)
- `GET /robots.txt` → 200, allows AI crawlers (GPTBot, ClaudeBot, Google-Extended, PerplexityBot…), references the sitemap.
- `GET /sitemap.xml` → 200, valid XML listing core routes.
- `GET /llms.txt` → 200, a readable business summary.
- View source on `/` → a static `application/ld+json` block describing Organization/FurnitureStore + 3 branches + WebSite.
- Navigate between pages and confirm the **document title and meta description change per page** (Home vs Shop vs a product vs FAQ), and that a **canonical link** updates. (These are set dynamically — check after each navigation.)

---

## 17. Accessibility & polish sweep
- Tab through each page: every interactive control is reachable and shows a focus ring; logical order.
- Images have `alt` text (decorative ones may be empty, which is fine).
- Colour contrast of text on gold/navy/glass backgrounds meets AA (flag low-contrast text).
- The "Skip to content" link works.
- Modals/drawers trap focus and close on Escape.
- Forms announce validation errors.

---

## 18. Priorities for your report
Rank findings so the team fixes the right things first:
- **Blocker:** anything that breaks buying, loses data, exposes prices to workers, crashes a page, or leaks unfilled placeholders on legal pages.
- **Major:** broken flows, RTL breakage, wrong currency/tax, missing validation, access-control gaps, console errors.
- **Minor:** untranslated strings, small layout issues, missing alt text, weak focus states.
- **Polish:** spacing, alignment, micro-copy, animation nits.

Be exhaustive and specific. Small mistakes matter — report them all, with a screenshot and exact reproduction steps.
