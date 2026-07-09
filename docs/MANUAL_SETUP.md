# Manual setup checklist — what you must do outside the code

The site cannot finish checkout, cards, or emails until these are set in **Vercel** (and Firebase / payment dashboards). Code alone is not enough.

Live site: https://raafat-furniture.vercel.app  
Vercel → Project → **Settings → Environment Variables** (Production + Preview). Redeploy after every change.

---

## 1. Firebase service account (fixes “Ordering is not configured…”)

**What it is:** A private key that lets the *server* talk to Firestore as Admin. Orders are created only on the server (prices, tax, order numbers). Without this, checkout returns **503**.

**How to get it**
1. Open [Firebase Console](https://console.firebase.google.com) → your project.
2. **Project settings** (gear) → **Service accounts**.
3. **Generate new private key** → download the JSON file.
4. Open the file, copy **the entire JSON** (one object).
5. In Vercel, add:
   - Name: `FIREBASE_SERVICE_ACCOUNT`
   - Value: paste the JSON **as a single line** (or paste normally; Vercel accepts multiline).
6. **Redeploy** the project.

**Locally:** put the same value in `.env` (never commit `.env` or the JSON file).

Also keep the existing `VITE_FIREBASE_*` client keys (Auth + Firestore for the browser). Those are separate from the service account.

---

## 2. Firestore rules (security)

**What it is:** Who can read/write which documents. Wrong rules = customers writing orders or reading other people’s data.

1. Open `firestore.rules` in this repo.
2. Firebase Console → **Firestore** → **Rules**.
3. Paste the full file → **Publish**.

Do **not** deploy `storage.rules` — this project uses **Cloudinary only** for files (no Firebase Storage).

---

## 3. Cloudinary (images + 3D models)

**What it is:** Hosts product photos, GLB models, and scan frames.

| Variable | Where | Purpose |
|----------|--------|---------|
| `VITE_CLOUDINARY_CLOUD_NAME` | Vercel + `.env` | Your cloud name |
| `VITE_CLOUDINARY_UPLOAD_PRESET` | Vercel + `.env` | Unsigned upload preset |
| `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` | Vercel only | Admin delete API |

In Cloudinary: create an **unsigned** upload preset. For GLB uploads, allow **Raw** (or Auto) resource type.

---

## 4. Payment rails

### A. InstaPay + bank transfer (no API keys)

1. Sign in as **developer** → **Admin → Team** (bottom: Payment settings).
2. Set **InstaPay address** (e.g. `yourstore@instapay`) and **bank details**.
3. **Admin → Dev → Checkout payment options**: turn **InstaPay** / **Bank transfer** on or off.
4. Save, then open checkout in a **new tab** or refresh (config cache is short).

### B. Stripe (international cards / Apple Pay / Google Pay)

| Variable | Purpose |
|----------|---------|
| `VITE_STRIPE_PUBLISHABLE_KEY` | Client (safe to expose) |
| `STRIPE_SECRET_KEY` | Server only |
| `STRIPE_WEBHOOK_SECRET` | Verifies Stripe webhooks |

1. Create a Stripe account → get keys.
2. Add webhook endpoint: `https://raafat-furniture.vercel.app/api/stripe/webhook`  
   Event: `checkout.session.completed`.
3. Paste the webhook signing secret into `STRIPE_WEBHOOK_SECRET`.
4. Set `SITE_URL=https://raafat-furniture.vercel.app` (required in production so payment return URLs cannot be hijacked).
5. Enable the method under **Dev → Checkout payment options**.

### C. Paymob (Egypt cards)

| Variable | Purpose |
|----------|---------|
| `PAYMOB_API_KEY` | Auth |
| `PAYMOB_INTEGRATION_ID` | Integration |
| `PAYMOB_IFRAME_ID` | Hosted page |
| `PAYMOB_HMAC_SECRET` | Webhook signature check |

Webhook: `https://raafat-furniture.vercel.app/api/paymob/webhook`.

---

## 5. Email (Resend)

| Variable | Purpose |
|----------|---------|
| `RESEND_API_KEY` | Send mail |
| `EMAIL_FROM` | From address (verified domain in Resend) |
| `CONTACT_EMAIL` | Contact form inbox |
| `SITE_URL` | Links in emails |
| `EMAIL_REPLY_TO` | Optional order-thread replies |

Without these, orders still create, but customers may not get confirmation emails.

---

## 6. Staff roles

1. Sign in with the bootstrap developer Google account.
2. **Admin → Team** → add emails as `admin`, `developer`, or `worker`.
3. **Worker** only sees `/staff` (specs, no prices, no customer PII).
4. **Admin** — catalog, orders, settings, scans, reviews.
5. **Developer** — everything admin + team + Dev tab (launch, errors, payment toggles).

---

## 7. Coming soon / launch

**Admin → Dev → Launch:** toggle coming soon, waitlist, go-live email. Optional until you are ready for the public.

---

## 8. Analytics (optional)

`VITE_GA_MEASUREMENT_ID` — GA4, only after cookie consent.

---

## 9. Legal copy

Edit `lib/legalContent.ts` — replace `[BUSINESS LEGAL NAME]` and other placeholders before launch.

---

## Quick “is it set up?” checks

| Symptom | Likely missing |
|---------|----------------|
| “Ordering is not configured… FIREBASE_SERVICE_ACCOUNT” | §1 |
| Checkout only shows Bank transfer / wrong methods | §4 toggles + refresh; or Stripe/Paymob env missing |
| Card pay fails after order | Stripe/Paymob keys or `SITE_URL` |
| No confirmation email | Resend vars |
| Upload GLB fails | Cloudinary preset Raw/Auto |
| Permission denied on Firestore | §2 rules not published |

After changing Vercel env: **Deployments → Redeploy**.

---

## InstaPay — what customers see (step by step)

1. At checkout they choose **InstaPay** (only if enabled and Egypt-relevant).
2. They place the order (no card form). Order status: **pending payment**.
3. Confirmation page + email tell them to:
   - Open any Egyptian banking / InstaPay app.
   - Send the **exact order total** to your InstaPay address (from Team settings).
   - In the transfer **note / title**, write exactly:  
     `{orderNumber} {Full Name}`  
     e.g. `EG123456KY Sara Ali`  
     (copy button on the page).
   - Copy the bank’s **transaction reference**.
   - Paste it on the confirmation page and submit.
4. Order moves to **payment verification**. You (admin) check InstaPay / bank, then mark paid in **Admin → Orders**.
5. Production flow continues as usual.

If the InstaPay address is empty in Team settings, the page says details will be emailed — set the address so customers are not stuck.
