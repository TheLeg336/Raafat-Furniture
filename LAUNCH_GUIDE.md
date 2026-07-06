# Raafat Furniture — Launch Guide

Everything you need to take the site live, in plain language.

**Contents**
1. [Do I need to spend money right away?](#1-do-i-need-to-spend-money-right-away)
2. [Manual setup checklist](#2-manual-setup-checklist)
3. [Google Analytics — setup & why it helps](#3-google-analytics--setup--why-it-helps)
4. [SEO & getting recommended by AI (Google, ChatGPT, Gemini…)](#4-seo--getting-recommended-by-ai)
5. [Full cost breakdown with real examples](#5-full-cost-breakdown-with-real-examples)
6. [What I still need from you](#6-what-i-still-need-from-you)
7. [How everything works (incl. 3D & AR)](#7-how-everything-works)
8. [Legal status](#8-legal-status)

---

## 1. Do I need to spend money right away?

**No — you can launch almost free and only pay for bigger things if the site takes off.**

Everything is **already built**. Turning features on later is not development work — it's usually just pasting a key or clicking "upgrade" on a plan. Here's the split:

**Pay now (the bare minimum to go live):**
- A **domain name** — ~$12/year.
- **Vercel hosting** — you can start on the **free** plan to test. For a real business Vercel asks you to be on **Pro ($20/month)**. You can launch on free and upgrade the day you're serious.
- Everything else — database, login, images, email, analytics — runs on **free tiers** that comfortably cover a new store.
- Payments: start with **InstaPay + cash + bank transfer**, which cost you **0% in fees**.

**Pay later, only when it grows (and each is a simple, no-code step):**
- Card payments (Paymob or Stripe) — just add an API key when you want them. You only pay fees per sale.
- Bigger image/email/hosting plans — only if traffic and volume grow past the free tiers. One click to upgrade.
- A US company (~$500 one-time) — only if you choose Stripe for international cards.

So: **start with the whole site pre-built, spend ~$12–20 to launch, and later the only things you add are simple.**

---

## 2. Manual setup checklist

Do these in order.

### A. Put the code online (push + pull request)
The work is on the branch `worktree-launch-readiness`. Your GitHub `main` is an **older, different version** — I've saved it as a backup branch (see the end of this section), so nothing is lost.

```bash
gh auth login                 # log in to GitHub once
git push -u origin HEAD        # push the launch branch
gh pr create --draft           # open a draft pull request to review & merge
```

### B. Set environment variables (Vercel → Settings → Environment Variables)
Server keys have **no `VITE_` prefix** — never put a secret in a `VITE_` variable (those go to the browser).

| Variable | What it does | Needed to launch? |
|---|---|---|
| `FIREBASE_SERVICE_ACCOUNT` | Lets the server create orders securely. **Without it, checkout is off.** Paste the service-account JSON as one line. | **Yes — critical** |
| `VITE_FIREBASE_*` | Connects the site to database/login/storage | **Yes** |
| `VITE_CLOUDINARY_*`, `CLOUDINARY_API_SECRET` | Product image hosting | **Yes** |
| `RESEND_API_KEY`, `EMAIL_FROM`, `CONTACT_EMAIL`, `SITE_URL` | Order + contact emails | **Yes** (else emails just log) |
| `VITE_SITE_URL` | Your domain, e.g. `https://www.raafatfurniture.com` (used for SEO links) | Recommended |
| `VITE_GA_MEASUREMENT_ID` | Turns on Google Analytics | Recommended |
| `NVIDIA_API_KEY` | Powers the admin "auto-translate" button | Optional |
| `NVIDIA_MODEL` | Which free model (default `meta/llama-3.1-8b-instruct`) | Optional |
| `PAYMOB_API_KEY`, `PAYMOB_INTEGRATION_ID`, `PAYMOB_IFRAME_ID`, `PAYMOB_HMAC_SECRET` | Egypt card payments | When you add cards |
| `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `VITE_STRIPE_PUBLISHABLE_KEY` | International cards + Apple/Google Pay | When you add cards |

> **Get `FIREBASE_SERVICE_ACCOUNT`:** Firebase Console → Project Settings → Service Accounts → *Generate new private key* → paste the whole JSON file into the variable.

### C. Get the free NVIDIA key for auto-translate (optional)
1. Go to **build.nvidia.com**, sign in, and create an API key (starts with `nvapi-`). It's free.
2. Put it in `NVIDIA_API_KEY`. That's it — the admin "Auto-Translate" button now writes Egyptian-Arabic (or English) for product listings.
3. If the default model ever hits a limit, set `NVIDIA_MODEL` to another free one like `meta/llama-3.3-70b-instruct` (better Arabic) — no code change.

### D. Publish the database security rules
```bash
firebase deploy --only firestore:rules,storage
```
This enforces the protections (server-only orders, workers can't see prices, guest orders private).

### E. Fill in your real domain for SEO
Search-and-replace `www.raafatfurniture.com` with your real domain in these files: `index.html`, `public/robots.txt`, `public/sitemap.xml`, `public/llms.txt`, and set `VITE_SITE_URL`. Also open `lib/siteConfig.ts` and fill the `FILL_ME` values (email, social links).

### F. Fill in the legal documents
In `lib/legalContent.ts`, replace `[BUSINESS LEGAL NAME]`, `[REGISTERED ADDRESS, EGYPT]`, `[privacy@DOMAIN]`, `[DOMAIN]` with the real values. **Until then the legal pages show placeholder text.** Send me the values and I'll drop them in.

### G. Set up the store in the admin panel
- **Admin → Team:** add your admins and workers; set your **InstaPay address** and **bank details**.
- **Admin → Catalog:** add products with **both an EGP and a USD price** each.
- **Admin → Scans & 3D:** optionally add 3D models (see [3D & AR](#3d--ar)).

### H. Add a share image (optional but nice)
Add a `1200×630` image at `public/og-image.png` — this is the picture that shows when the site is shared on WhatsApp/Facebook/Twitter.

### I. Payment webhooks (only when you turn cards on)
- **Stripe:** dashboard → webhook to `https://<your-domain>/api/stripe/webhook`, event `checkout.session.completed`, secret → `STRIPE_WEBHOOK_SECRET`.
- **Paymob:** dashboard → transaction callback to `https://<your-domain>/api/paymob/webhook`, HMAC secret → `PAYMOB_HMAC_SECRET`.

### J. Your GitHub backup
Your current live GitHub version has been preserved on a branch named **`backup/pre-launch-main`** (and the original commit is `58b8282`). If anything ever goes wrong, that's the old site, untouched.

---

## 3. Google Analytics — setup & why it helps

Analytics is **built in and privacy-safe** (it only runs after a visitor accepts cookies). You just need to create a free account and paste one ID.

**How to set it up (5 minutes):**
1. Go to **analytics.google.com** → *Start measuring* → create an **Account** (e.g. "Raafat Furniture").
2. Create a **Property** → choose your time zone (Egypt) and currency.
3. Create a **Web data stream** → enter your website URL. Google gives you a **Measurement ID** that looks like `G-XXXXXXXXXX`.
4. Put that ID into the Vercel variable `VITE_GA_MEASUREMENT_ID` and redeploy.
5. Done. Visit your site, accept cookies, and within a minute you'll see yourself in Google Analytics → *Realtime*.

**Why it's worth it (what you'll learn):**
- **How many people visit**, from which countries (Egypt vs USA vs rest) and on phone vs desktop.
- **What they look at** — which products and categories get the most attention.
- **Where they drop off** — e.g. if people add to cart but don't check out, you'll see it and can fix it.
- **What marketing works** — which links/ads actually bring buyers.
- The site already sends key events automatically: **product views, add-to-cart, "view in AR", and purchases** — so you can see the whole funnel from browsing to buying.

---

## 4. SEO & getting recommended by AI

You asked for two things: rank well on Google **and** get recommended by AI assistants (ChatGPT, Claude, Gemini, Google's AI Overview, Perplexity). Both are now built in. Here's what's done and what you should do.

**What's already built:**
- **Rich page information** — every page has a proper title, description, and preview image, in a way Google and social apps understand.
- **Structured data (schema.org)** — the site tells search engines and AI *exactly* what it is: a **furniture store in Egypt**, its **3 branches, phone, and hours**, that it sells specific furniture types, accepts specific payments, and serves Egypt/USA/worldwide. Each product page also declares its **name, price, currency, and availability**. This is the single biggest lever for being understood and recommended.
- **An AI-readable brochure** — a file at `/llms.txt` that spells out, in plain text, who you are, what you sell, where, how ordering works, and your locations. This is the emerging standard that AI assistants read.
- **AI crawlers are explicitly welcomed** — `robots.txt` invites GPTBot (ChatGPT), ClaudeBot (Claude), Google-Extended (Gemini/AI Overview), PerplexityBot, and others to read the site. Many sites accidentally block these; yours invites them.
- **A sitemap** so search engines find every page.
- **Bilingual signals** for Arabic (Egypt) and English (US/worldwide), with keywords for both.

**What you should do to make it work:**
1. **Set your real domain** everywhere (Section 2E) — SEO needs the true web address.
2. **Submit to Google:** create a free **Google Search Console** account (search.google.com/search-console), verify your domain, and submit `https://your-domain/sitemap.xml`. This tells Google to index you.
3. **Keep the business facts consistent everywhere** — same name, address, and phone on the site, Google Business Profile, Facebook, Instagram. AI and Google trust businesses whose details match across the web.
4. **Create a free Google Business Profile** for each showroom (business.google.com) — this is huge for "furniture store near me" and map results in Egypt.
5. **Link your social accounts** in `lib/siteConfig.ts` (the `social` list) — it strengthens trust signals.

**Honest note:** No one can *guarantee* an AI will always recommend a specific store — their answers aren't for sale and change over time. What we've done is give the site **every signal that makes recommendation likely**: clear identity, structured facts, crawler access, and a machine-readable summary. That's exactly what makes an AI able to confidently name and describe your business when someone asks "where can I buy custom furniture in Egypt?"

---

## 5. Full cost breakdown with real examples

### Fixed costs
| Item | Cost | When |
|---|---|---|
| Domain name | ~$12 | per year |
| Vercel hosting (Pro, for commercial use) | $20 | per month (can start free) |
| Firebase (database/login/storage) | $0 on free tier | grows to a few $/mo only at scale |
| Cloudinary (images) | $0 up to ~25 GB | ~$89/mo only if you far exceed it |
| Resend (email) | $0 up to 3,000/mo | $20/mo for 50,000 |
| Google Analytics | $0 | forever |
| NVIDIA translate | $0 (free tier) | forever for normal use |
| US LLC (only if you pick Stripe) | $500 | one-time |

**Typical monthly fixed cost at launch: about $20 (Vercel) + ~$1/month for the domain.** Everything else is free until you grow.

### Payment fees — worked examples
You only pay these **when a customer actually pays by card**. InstaPay, cash, and bank transfer are **free (0%)**, so if most Egyptian customers use those, your fees stay near zero.

Two card options:
- **Paymob** — for Egyptian cards & wallets. ~**2.75% + ~EGP 3** per sale. No monthly fee. Needs Egyptian commercial registration. No foreign company needed.
- **Stripe** — for international cards + Apple/Google Pay. **2.9% + $0.30**, plus **~1.5% extra on foreign cards** (so realistically ~3–4.4% for overseas buyers). No monthly fee. Needs a US/EU company ($500 one-time).

> **Are they either/or?** Not quite. Stripe **cannot** process Egyptian local cards (it doesn't operate for local payments in Egypt) — so for Egyptian card customers you'd use Paymob, and for international card customers you'd use Stripe. But since **InstaPay/cash cover Egypt for free**, you can happily launch with no card processor at all and add one only when customers ask.

**Examples** (assuming an average order of ~$400 / ~EGP 20,000, and that *every* order is paid by card — in reality many won't be):

| Monthly card sales | ≈ orders | Paymob cost (Egypt cards) | Stripe cost (international cards) |
|---|---|---|---|
| $5,000 | ~12 | ~$138 (2.75% + fees) | ~$149 domestic / up to ~$225 foreign |
| $20,000 | ~50 | ~$553 | ~$595 domestic / up to ~$895 foreign |
| $50,000 | ~125 | ~$1,378 | ~$1,488 domestic / up to ~$2,240 foreign |

**Reading this:** Paymob is a bit cheaper and needs no foreign company, so it's the natural first card option for an Egypt-based store. Stripe is the one that unlocks **international card buyers and Apple/Google Pay**. And remember — **every InstaPay/cash order in that revenue costs you $0**, so your real blended fee is usually much lower than the table.

### The realistic picture
- **Launch:** ~$20/month + $12/year, **0% payment fees** (InstaPay/cash/bank).
- **Growing:** add card fees only on card orders; upgrade a plan or two if you get busy.
- **No surprise bills:** nothing here auto-charges big amounts — the paid tiers are opt-in upgrades.

---

## 6. What I still need from you

These are the open items. Send them whenever ready and I'll wire them in.

**Blockers before a real public launch:**
1. **Legal identity** (for the legal pages): registered legal name, official Egypt address, support/privacy email, final domain.
2. **VAT status:** is the business VAT-registered (turnover over EGP 500,000/year)? The site charges 14% VAT on Egyptian orders — I should turn that **off** if you're not registered yet, because charging VAT you don't remit is a liability.

**Needed soon:**
3. **Product prices** in **both EGP and USD** for each item.
4. **Card processor choice** to activate first (Paymob for Egypt / Stripe for international) — or stay on InstaPay+cash for now.
5. **Return policy confirmation:** currently written as *14-day returns for ready-made items; custom items non-returnable with a deposit.* Confirm this matches how you operate, and tell me the **deposit %** for custom orders.
6. **Business details to verify:** the three branch addresses, phone `01010279777`, and hours (12:00–22:00, Mon–Sat) — confirm they're current.
7. **Social media links** (Instagram / Facebook / TikTok) for SEO and trust.
8. **Staff list:** who are admins vs workshop workers (to set their access).

**Things you said you'd confirm with the business later:**
- Final return-policy wording (you chose 14 days as the minimum for now — confirm with the business).
- Whether to also target Arabic-heavy SEO more aggressively (currently balanced EN + AR).

---

## 7. How everything works

A plain tour so you can run the store and explain it to the team.

### Roles (who sees what)
Set in **Admin → Team**:
- **Customer** — shops, orders, tracks, reviews, saves favourites.
- **Worker** (workshop) — sees **only** the `/staff` checklist: what to build for each order (item, colour, material, size). **No prices, no customer info.** Enforced on the server, not just hidden.
- **Admin** — full control. A **developer** admin can also manage team members.

### The order journey
1. **Checkout** — customer picks pickup / delivery / custom, enters details, chooses payment. The **server** calculates price, tax, and total from your catalog — the browser is never trusted, so prices can't be faked.
2. **Unique order number** like `EG482913KY` (country + 6 digits + random letter + name initial). Never reused.
3. **Confirmation page** — green checkmark, order number, full receipt (VAT shown for Egypt, duties note for exports), plus a confirmation email.
4. **Payment:**
   - *InstaPay / bank transfer:* customer sends money and pastes the transfer reference; an admin verifies and marks it paid.
   - *Cash on pickup:* confirmed immediately (Egypt only).
   - *Card (when enabled):* auto-marked paid when payment lands.
5. **Workshop prepares it** — workers open `/staff`, oldest orders first, tick each item as they build it. Progress saves automatically and syncs across devices. "Order complete" unlocks only when everything is ticked.
6. **Admin approves & releases** — order moves to **Awaiting Approval**; admin double-checks, then either "Notify — ready for pickup" (email) or enters a **tracking number** for delivery (emails the customer).
7. **Customer tracks** at `/track` with order number + email — a live timeline.

### Payments — on vs dormant
- **Live now:** InstaPay, bank transfer, cash on pickup (Egypt).
- **Coded, add a key to switch on:** Paymob (Egypt cards + wallets), Stripe (international cards + Apple/Google Pay).
- **Rules:** delivery is always prepaid; cash-on-pickup only appears for visitors in Egypt.

### Currency (EGP / USD)
- Each product has **two prices** (EGP and USD) you set in the admin.
- **Browsing:** shows EGP to visitors in Egypt, USD to everyone else, based on their location. There's also a manual **EGP/USD switch** in the header.
- **Checkout:** the currency actually charged is locked to the **delivery destination** — Egypt/pickup pays EGP, exports pay USD — regardless of the browse toggle (stops VPN tricks).
- **VAT:** 14% included in Egyptian prices (shown on the receipt); exports are tax-free.

### Auto-translate for listings (Egyptian dialect)
When an admin fills only English (or only Arabic) for a product, the **Auto-Translate** button fills the other language using NVIDIA's free AI, tuned to write **natural, premium Egyptian-dialect Arabic**. It never overwrites text you already typed.

### 3D & AR
On products with a 3D model, customers can spin the piece and **place it in their room at real size** — like "View in your room" on Amazon/IKEA.

**Customer experience:**
1. On the product page they see a **3D viewer** — drag to rotate, pinch/scroll to zoom.
2. They pick a **colour/material** and the model updates live.
3. On a phone they tap **"View in your space"** — the camera opens and the furniture appears on their floor at true size, in the chosen finish. Works on iPhone and Android, **no app needed**.

**How you add a 3D model (two ways), in Admin → Scans & 3D:**

*Option 1 — Upload a ready model (easiest):* upload a **`.glb`** file (or paste a link), optionally add a **`.usdz`** for best iPhone AR, enter the real **dimensions**, define the **colour/material options**, and attach it to the product.

*Option 2 — Scan a real piece with a phone (free, no equipment):*
1. Use the **guided scanner** — it opens the camera and walks you around the piece, auto-capturing ~32 photos.
2. Enter the real dimensions (for correct AR scale).
3. Turn the photos into a model:
   - **Free / manual (recommended to start):** run the photos through free desktop software — **[Meshroom](https://alicevision.org/#meshroom)** or **RealityScan** — which outputs a `.glb`. Upload that back in Admin → Scans & 3D. Only cost is a decent PC.
   - **Automatic (optional, paid):** plug a photogrammetry service into `VITE_PHOTOGRAMMETRY_API_URL` and scans convert automatically.

> **Best starting workflow:** a worker photographs a piece with the guided scanner → someone runs it through free Meshroom → uploads the `.glb`. Every piece becomes 3D + AR for **$0** in software.

**Scan tips:** even lighting, a matte (non-shiny, non-transparent) piece, and a plain background give the best results.

### Other built-in features
- **Contact** (form → email + WhatsApp + phone), **FAQ** (editable), **Reviews** (customer star ratings, admin-approved), **Wishlist** (saved favourites), full **English + Egyptian-Arabic with right-to-left layout**, consent-based **Google Analytics**, and **Privacy/Cookies/Terms** legal pages.

---

## 8. Legal status

The Privacy Policy, Cookie Policy, and Terms are **fully drafted** for worldwide compliance (EU GDPR, UK, California CCPA/CPRA, and Egypt's Data Protection Law), and cover the real payment processors, returns, and custom-order terms. They are live on `/legal/privacy`, `/legal/cookies`, `/legal/terms`, and the cookie-consent banner is working.

**Before public launch they need two things from you** (see [Section 6](#6-what-i-still-need-from-you)): the **legal identity values** (name/address/email/domain) and confirmation of your **VAT status**. Once you send those, the legal side is complete.

> This is a thorough, real draft — but for peace of mind, have a lawyer in your main market glance over it before you go live. It's not a substitute for legal advice.

---

*Most text on the site is editable, and features toggle on/off with a key. Anything you want changed — just ask.*
