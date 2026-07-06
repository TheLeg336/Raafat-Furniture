# Raafat Furniture — Launch Guide

Everything you need to take the site live, explained in plain language. Three parts:

1. **[What you need to do manually](#1-what-you-need-to-do-manually)** — the checklist to go live
2. **[Questions to ask the business](#2-questions-to-ask-the-business)** — decisions only the owner can make
3. **[Cost breakdown](#3-cost-breakdown)** — one-time, monthly, yearly, and per-sale
4. **[How everything works](#4-how-everything-works)** — so you can run it and explain it (incl. 3D & AR)

---

## 1. What you need to do manually

These are the things code can't do for you. Do them in order.

### A. Put the code online (push + open a pull request)
The work is committed on the branch `worktree-launch-readiness`. To publish it:

```bash
gh auth login                 # log in to GitHub once
git push -u origin HEAD        # push the branch
gh pr create --draft           # open a draft pull request to review + merge
```

> The GitHub remote is already set to `https://github.com/TheLeg336/Raafat-Furniture`. Nothing is auto-pushed — you stay in control of what merges.

### B. Set the environment variables (Vercel → Settings → Environment Variables)
The site reads its secrets from here. **Server keys have no `VITE_` prefix — never put a secret in a `VITE_` variable, those get sent to the browser.**

| Variable | What it does | Needed to launch? |
|---|---|---|
| `FIREBASE_SERVICE_ACCOUNT` | Lets the server create orders securely (prices/tax/order numbers). **Without it, checkout is disabled.** Paste the service-account JSON as one line. | **Yes — critical** |
| `VITE_FIREBASE_*` | Connects the site to your database/login/storage | **Yes** |
| `RESEND_API_KEY`, `EMAIL_FROM`, `CONTACT_EMAIL`, `SITE_URL` | Sends order emails + contact-form messages | **Yes** (or emails just log, no crash) |
| `VITE_GA_MEASUREMENT_ID` | Turns on Google Analytics (privacy-consented) | Recommended |
| `GEMINI_API_KEY` | Powers the admin "auto-translate" button for listings | Optional |
| `GEMINI_MODEL` | Which Gemini model to use (default `gemini-2.5-flash`, free tier) | Optional |
| `PAYMOB_API_KEY`, `PAYMOB_INTEGRATION_ID`, `PAYMOB_IFRAME_ID`, `PAYMOB_HMAC_SECRET` | Turns on card payments in Egypt | When you add cards |
| `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `VITE_STRIPE_PUBLISHABLE_KEY` | Turns on international cards + Apple/Google Pay | When you add cards |
| `VITE_CLOUDINARY_*`, `CLOUDINARY_API_SECRET` | Product image hosting | **Yes** |

> Get `FIREBASE_SERVICE_ACCOUNT` from **Firebase Console → Project Settings → Service Accounts → Generate new private key**, then paste the whole JSON file contents into the variable value.

### C. Publish the database security rules
```bash
firebase deploy --only firestore:rules,storage
```
This enforces all the money-path protections (server-only orders, workers can't see prices, guest orders aren't public).

### D. Fill in the legal documents
Open `lib/legalContent.ts` and replace these 5 placeholders with the real business details:
- `[BUSINESS LEGAL NAME]` — the registered company name
- `[REGISTERED ADDRESS, EGYPT]` — the official address
- `[privacy@DOMAIN]` — a real support/privacy email
- `[DOMAIN]` — your website domain

> Until these are filled, your Privacy/Terms pages show placeholder text to real visitors. **This is a legal blocker.** Send me the 4 values and I'll drop them in.

### E. Set up the store inside the admin panel
1. Sign in with the owner account, go to **Admin → Team**, and:
   - Add your **admins** (full access) and **workers** (workshop checklist only, no prices).
   - Set your **InstaPay address** and **bank transfer details** (shown to customers who pay by transfer).
2. Go to **Admin → Catalog** and add products. For each product set **two prices: EGP and USD** (see [currency](#currency-egp--usd) below).
3. Optionally add a **3D model** to products (see [3D & AR](#3d--ar-how-it-works)).

### F. Confirm your VAT status before charging tax
The site charges **14% VAT on Egyptian orders**. Only keep this on if the business is **VAT-registered** (mandatory once turnover passes EGP 500,000/year). If you're not registered yet, tell me and I'll switch Egyptian prices to plain (no VAT line) — charging VAT you don't remit is a liability. See the [questions](#2-questions-to-ask-the-business) below.

### G. Connect payment webhooks (only when you turn cards on)
- **Stripe:** dashboard → add webhook to `https://<your-domain>/api/stripe/webhook`, event `checkout.session.completed`, put the signing secret in `STRIPE_WEBHOOK_SECRET`.
- **Paymob:** dashboard → set the transaction callback to `https://<your-domain>/api/paymob/webhook`, put your HMAC secret in `PAYMOB_HMAC_SECRET`.

---

## 2. Questions to ask the business

Get answers to these before or shortly after launch. The ones marked ⚠️ are blockers.

| # | Question | Why it matters |
|---|---|---|
| 1 ⚠️ | **Registered legal name, official address, support email, and final domain?** | Goes into the legal pages (Section D). Legally required. |
| 2 ⚠️ | **Is the business VAT-registered?** (Turnover over EGP 500,000/year?) | Decides whether the site should charge/show the 14% VAT. Charging without registering is a liability. |
| 3 | **Do you have a Commercial Registration + Tax Card?** | Needed to onboard Paymob for card payments and to operate legally. |
| 4 | **Which card processor to activate first — Paymob (Egypt) or Stripe (international)?** | Both are coded. Paymob needs Egyptian registration; Stripe needs a US/EU entity. Launch is on InstaPay + cash regardless. |
| 5 | **Confirm the return policy: 14 days for ready-made items, custom items non-returnable with a deposit?** | Currently written into the Terms. Confirm it matches how the business actually operates. |
| 6 | **What deposit % for custom orders?** (e.g. 50%) | So we can state it clearly to customers. |
| 7 | **Branch addresses, phone, and opening hours correct?** | Shown in the footer and contact page. Verify the current ones. |
| 8 | **Who are the staff, and which are admins vs workshop workers?** | To set up their access in Admin → Team. |
| 9 | **Shipping: do you quote per-order, or want fixed rates by zone?** | Right now shipping is "confirmed after order." We can automate rates later if wanted. |
| 10 | **Product prices in both EGP and USD** for each item. | The site shows Egyptians EGP and international visitors USD. |

---

## 3. Cost breakdown

Assumes a small store at launch. You can genuinely go live for **~$20/month + ~$12/year** using InstaPay/cash (0% fees) and free tiers everywhere else.

### One-time costs
| Item | Cost | Needed? |
|---|---|---|
| Domain name (first year) | ~$12 | Yes |
| Egyptian Commercial Registration + Tax Card | varies | Needed for Paymob + to charge VAT (may already exist) |
| US LLC (via Stripe Atlas) | $500 | **Only if** you activate Stripe |
| Lawyer review of legal docs | a few hundred $ | Recommended, not required |
| Apple Developer account | **$0 — not needed** | AR runs in the browser, no app store |

### Monthly costs
| Service | Free tier (launch) | Paid when you grow |
|---|---|---|
| **Vercel** (hosting) | Free for testing | **~$20/mo** Pro (required for commercial use); 1 TB traffic |
| **Firebase** (database, login, storage) | Free: 50k reads/day, 5 GB storage | Pay-as-you-go, usually a few $/mo |
| **Cloudinary** (product images) | Free: ~25 GB | ~$89/mo if you outgrow it — watch this with big photos |
| **Resend** (email) | Free: 3,000/mo | $20/mo for 50k |
| **Google Analytics** | Free forever | — |
| **Gemini** (admin translate button) | Free tier, admin-only | pennies |

### Yearly costs
| Item | Cost |
|---|---|
| Domain renewal | ~$12/year |

### Per-sale costs (you only pay when you make money)
| Payment method | Fee | Status |
|---|---|---|
| **InstaPay** | ~free | ✅ Live at launch |
| **Cash on pickup** | free | ✅ Live at launch (Egypt only) |
| **Bank transfer** | free / small bank fee | ✅ Live at launch |
| **Paymob** (Egypt cards + wallets) | ~2.75% + ~EGP 1–3 per sale | Coded, activate when ready |
| **Stripe** (international cards + Apple/Google Pay) | 2.9% + $0.30 (+1.5% foreign cards) | Coded, activate when ready |
| PayPal | — | Not included (Stripe covers wallets) |

**Bottom line:** Launch cost is essentially **Vercel Pro ($20/mo) + domain ($12/yr)**, with 0% payment fees while you use InstaPay/cash. Card fees only start when you turn cards on.

---

## 4. How everything works

A plain-language tour so you can operate the store and explain it to the team.

### Roles (who sees what)
There are three levels of access, set in **Admin → Team**:
- **Customer** — normal shopper. Browses, orders, tracks, reviews, saves favourites.
- **Worker** (workshop staff) — sees **only** the `/staff` page: a checklist of what to build for each order (item, colour, material, dimensions). **No prices, no customer details.** This is enforced on the server, not just hidden — a worker literally cannot pull pricing or customer data.
- **Admin** — full control: catalog, orders, approvals, payments, reviews. A **developer** admin can also add/remove team members.

### The order journey (start to finish)
1. **Customer checks out.** They pick pickup / delivery / custom, enter their details, and choose how to pay. The **server** calculates the price, tax, and total from your catalog — the browser is never trusted, so nobody can tamper with prices.
2. **They get a unique order number** like `EG482913KY` = country (EG) + 6 digits + a random letter + the first letter of their name. Every number is guaranteed unique and never reused.
3. **They see a confirmation page** — a green checkmark, the order number, and a full receipt (with VAT broken out for Egypt, or a duties note for exports). A confirmation email goes out too.
4. **Payment:**
   - *InstaPay / bank transfer:* the customer sends the money and pastes their transfer reference. An admin verifies it in the orders panel and marks it paid.
   - *Cash on pickup:* confirmed immediately (Egypt only).
   - *Card (when enabled):* handled by Stripe/Paymob; the order is marked paid automatically when payment lands.
5. **The workshop prepares it.** Workers open `/staff`, see the oldest orders first, and tick off each item as they build it. Progress saves automatically and syncs across everyone's devices — anyone can pick up where a colleague left off. "Order complete" only unlocks once every item is ticked.
6. **Admin approves and releases.** When the workshop finishes, the order moves to **Awaiting Approval**. The admin double-checks it, then either:
   - *Pickup:* clicks "Notify customer — ready for pickup" (sends an email).
   - *Delivery:* enters a tracking number, which emails the customer and shows on their tracking page.
7. **Customer tracks it** anytime at `/track` using their order number + email — a live timeline from confirmed → preparing → ready/shipped → completed.

### Payments — what's on and what's dormant
- **Live now:** InstaPay, bank transfer, cash on pickup (Egypt).
- **Coded and ready to switch on:** Paymob (Egypt cards + Apple/Google Pay) and Stripe (international cards + Apple/Google Pay). Add the keys and they light up automatically.
- **Rules built in:** delivery orders must be paid up front; cash-on-pickup only appears for visitors in Egypt (checked by their internet location).

### Currency (EGP / USD)
- Each product has **two prices** you set in the admin (EGP and USD).
- **While browsing:** the site shows EGP to visitors in Egypt and USD to everyone else, based on their internet location. There's also a manual **EGP / USD switch** in the header.
- **At checkout:** the currency that's actually charged is locked to the delivery destination — Egypt/pickup pays in EGP, exports pay in USD — no matter what the browse toggle said. This stops anyone using a VPN to dodge the right pricing.
- **VAT:** 14% is included in Egyptian prices (shown broken out on the receipt); exports are tax-free with a note that local import duties are the buyer's responsibility.

### Auto-translate for listings (Egyptian dialect)
When an admin creates a product and fills in only English (or only Arabic), the **"Auto-Translate"** button fills in the other language using Google's Gemini AI. It's tuned to write **natural, premium Egyptian-dialect Arabic** (the way an upscale Cairo showroom writes) — not stiff textbook Arabic. It never overwrites text you already typed; it only fills the blanks. Runs on the free Gemini tier.

### 3D & AR — how it works
This is the standout feature. On products that have a 3D model, customers can spin the piece around and **place it in their own room at true-to-life scale** — like the "View in your room" feature on Amazon/IKEA.

**What the customer does:**
1. On a product page, they see a **3D viewer** instead of (or alongside) photos. They drag to rotate, pinch/scroll to zoom, and inspect it from any angle.
2. They pick a **colour/material** (e.g. walnut vs oak, charcoal vs cream linen) and the 3D model updates live.
3. On a phone, they tap **"View in your space"**. Their camera opens and the furniture appears on their floor at real size, in the colour they chose. They can walk around it and see if it fits — before buying.
   - Works on iPhone (AR Quick Look) and Android (Scene Viewer / WebXR). No app to install — it's all in the browser.

**How you add a 3D model to a product (two ways):**

*Option 1 — Upload a ready-made model (easiest if you have one):*
1. Go to **Admin → Scans & 3D**.
2. Upload a **`.glb` file** (the standard 3D format) — or paste a link to one. Optionally add a **`.usdz`** for the best iPhone AR quality.
3. Enter the real-world **dimensions** so AR places it at the correct size.
4. Define the **colour/material options** customers can switch between.
5. Attach it to the product. Done — the 3D viewer appears on that product automatically.

*Option 2 — Scan a real piece with a phone (free, no special equipment):*
1. In **Admin → Scans & 3D**, use the **guided scanner**. It opens the camera and walks the person around the furniture, auto-capturing ~32 photos from different angles.
2. Enter the real dimensions (for correct AR scale).
3. The photos are turned into a 3D model. There are two paths for that last step:
   - **Free / manual (recommended to start):** download the photos and run them through free desktop software — **[Meshroom](https://alicevision.org/#meshroom)** (Windows/Linux) or **RealityScan** (formerly RealityCapture, free) — which turns photos into a `.glb`. Then upload that `.glb` back in Admin → Scans & 3D. The only cost is a decent PC to run it; the software is free.
   - **Automatic (optional, paid):** if you later plug a photogrammetry service into `VITE_PHOTOGRAMMETRY_API_URL`, scans convert to models automatically with no manual step.

> **The practical starting workflow:** a worker photographs a piece with the guided scanner → someone runs the photos through free Meshroom on a PC → uploads the resulting `.glb`. Every furniture piece becomes viewable in 3D and AR for **$0** in software.

**Tips for good scans:** even lighting, a piece that isn't shiny/reflective/transparent, and a plain background give the best results. Bold-coloured, matte furniture scans best.

### Other things built in
- **Contact page** (`/contact`) — a form that emails the store, plus a WhatsApp button and phone.
- **FAQ page** (`/faq`) — delivery, returns, custom orders, care, AR — all editable text.
- **Reviews** — customers leave star ratings + text; admins approve them before they show publicly.
- **Wishlist** — customers save favourites to their account.
- **Bilingual + right-to-left** — full English and Egyptian-Arabic, with the whole layout mirroring correctly in Arabic.
- **Analytics** — Google Analytics 4, only after the visitor accepts cookies (GDPR/Egypt-PDPL compliant).
- **Legal pages** — Privacy, Cookies, Terms, drafted for Egypt + EU + US compliance (fill the placeholders first).

---

*Questions or want something changed? The whole site is built to be edited — most text is editable, and features can be turned on/off with a key. Just ask.*
