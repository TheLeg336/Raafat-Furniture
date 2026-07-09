# Manual setup checklist — what you must do outside the code

The site cannot finish checkout, cards, emails, uploads, or 3D until these are set in **Vercel** (and Firebase / Cloudinary / payment dashboards). Code alone is not enough.

Live site: https://raafat-furniture.vercel.app  
Vercel → Project → **Settings → Environment Variables** (Production + Preview). **Redeploy after every change.**

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

## 3. Cloudinary (images + 3D models + scan frames)

**What it is:** Hosts product photos, GLB models, and scan camera frames.

| Variable | Where | Purpose |
|----------|--------|---------|
| `VITE_CLOUDINARY_CLOUD_NAME` | Vercel + `.env` | Your cloud name |
| `VITE_CLOUDINARY_UPLOAD_PRESET` | Vercel + `.env` | Unsigned upload preset |
| `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` | Vercel only | Admin delete API |

### Cloudinary dashboard steps (required for 3D)

1. Create an **unsigned** upload preset (Settings → Upload → Upload presets).
2. Allow resource type **Raw** or **Auto** (GLB files are “raw”, not images).
3. Same preset is used for product images *and* GLB — allow both image and raw.
4. Optional folders used by the app:
   - Product images → default / your preset folder
   - GLB models → `models/`
   - Scan frames → `scans/{scanId}/`

If GLB upload fails with “unsigned / not allowed”, the preset is missing Raw/Auto.

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
4. **Admin** — catalog, orders, settings, scans (inside product edit), reviews.
5. **Developer** — everything admin + team + Dev tab (launch, errors, payment toggles).

---

## 7. Coming soon / launch

**Admin → Dev → Launch:** toggle coming soon, waitlist, go-live email. Optional until you are ready for the public.

---

## 8. Analytics (optional)

`VITE_GA_MEASUREMENT_ID` — GA4, only after cookie consent.

---

## 9. Legal copy

Edit `lib/legalContent.ts` — replace `[BUSINESS LEGAL NAME]`, `[REGISTERED ADDRESS, EGYPT]`, `[privacy@DOMAIN]`, and `[DOMAIN]` before launch.

- English and Arabic legal pages both exist.
- Arabic legal text is **formal Modern Standard Arabic** (فصحى قانونية), not dialect — keep it that way for compliance.
- Have a lawyer review before go-live.

---

## 10. 3D models, AR, and scanning (how it actually works)

There is **no magic “scan → finished furniture model” button inside the repo** unless you connect an external reconstruction service. Here is the real pipeline.

### What customers see

1. Product has a `model3d.url` (GLB on Cloudinary).
2. Product page shows a **3D** tab with Google `<model-viewer>`.
3. **View in your space**:
   - **iPhone** — best with a USDZ URL (`iosUrl`) → Apple Quick Look.
   - **Android** — Scene Viewer from the GLB.
   - **Desktop** — QR code opens the product on the phone with `?ar=1`.
4. Colour / material swatches can tint the model if you set variants in admin.

### Accurate size (important)

AR size comes from the **GLB itself** (1 unit should = 1 metre).  
Optionally enter **Width / Height / Depth** on the product’s 3D section — the viewer scales the mesh to match those real-world measurements.

If the GLB is wrong size and you leave dimensions blank, AR will look too big or too small. That is not a bug in the storefront — fix the file or enter dimensions.

### Admin: attach a finished model (recommended path)

1. Open **Admin →** edit a product → section **3D model & AR**.
2. **Upload GLB** (max ~50 MB) — browser lightly optimizes it, then uploads to Cloudinary `models/`.
3. Optional: paste **USDZ** URL for iOS.
4. Optional: enter real-world **cm/m** dimensions.
5. Optional: add colour variants (label + colour; optional GLB material name).
6. Save the product.

### Admin: guided scan (capture frames only)

Scanning lives **inside the product form** (not a separate `/admin/scans` page).

| Step | What happens | Where |
|------|----------------|-------|
| Start **Scan object** | Opens camera UI (or QR to phone) | Browser |
| Walk around / tap shutter | Up to **32** JPEG frames (≤1280px) | Phone/browser |
| Enter dimensions (optional) | Saved on the scan job | Firestore `scans/{id}` |
| Upload frames | Each frame → Cloudinary `scans/{id}/` | Cloudinary |
| After upload | Status `queued` (or `processing` if a reconstruction URL is set) | Firestore |

**Phone QR handoff:** desktop shows a QR → `https://yoursite/m/scan/{scanId}`.  
The phone must be signed in as an **admin** (same Firebase Auth). Then capture runs on the phone; desktop listens for a finished `modelUrl`.

### What scanning does *not* do by itself

Turning photos into a clean GLB (photogrammetry) is **heavy** and is **not built into this website**. Options:

| Option | What you do |
|--------|-------------|
| **A — Manual (default)** | Capture frames for reference, then build/export a GLB in Polycam, RealityScan, Meshroom, Blender, etc. Upload that GLB in the product form. |
| **B — External API (optional)** | Set `VITE_PHOTOGRAMMETRY_API_URL` to a service you host. The browser POSTs `{ scanId, frameUrls, dimensions }`. That service must process frames and write `modelUrl` + `status: "ready"` back to Firestore `scans/{id}` (needs its own Firebase Admin credentials). |

Without B, scans stay **queued** until you attach a GLB yourself. That is expected.

### Limits

| Limit | Value |
|-------|--------|
| GLB upload | 50 MB |
| Frames per scan | 32 |
| Frame size | ≤1280px long edge, JPEG ~0.82 quality |
| Camera | Needs **HTTPS** (or localhost) |
| Auto 360° capture | Best on **iOS** (compass). **Android** uses manual shutter (more accurate). |
| Cloudinary | Depends on your Cloudinary plan (storage + bandwidth) |

### Optional env for auto-reconstruction

| Variable | Required? | Notes |
|----------|-----------|--------|
| `VITE_PHOTOGRAMMETRY_API_URL` | No | Client-visible URL. Protect the endpoint yourself. |
| `SITE_URL` / `VITE_SITE_URL` | Yes for QR | Correct domain on QR codes and emails |

### NVIDIA / translate (not 3D)

`NVIDIA_API_KEY` is only for **admin product name/description translation** (Egyptian dialect copy). It does **not** build 3D models.

---

## 11. Other useful env vars

| Variable | Purpose |
|----------|---------|
| `SITE_URL` | Canonical site URL (payments, emails, QR) |
| `VITE_STORE_CURRENCY` | Display currency |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Stripe.js |
| `NVIDIA_API_KEY` / `NVIDIA_MODEL` | Admin auto-translate |
| `VITE_GA_MEASUREMENT_ID` | Analytics |

Full list also in `SETUP.md`.

---

## Quick “is it set up?” checks

| Symptom | Likely missing |
|---------|----------------|
| “Ordering is not configured… FIREBASE_SERVICE_ACCOUNT” | §1 |
| Checkout only shows Bank transfer / wrong methods | §4 toggles + refresh; or Stripe/Paymob env missing |
| Card pay fails after order | Stripe/Paymob keys or `SITE_URL` |
| No confirmation email | Resend vars |
| Upload GLB fails | Cloudinary preset Raw/Auto (§3) |
| Permission denied on Firestore | §2 rules not published |
| Scan camera won’t start | Use HTTPS; allow camera permission |
| Phone QR scan asks for login | Sign in as admin on the phone |
| Scan stuck on “queued” | Normal without photogrammetry API — upload a GLB manually |
| AR size wrong | Export GLB at 1 unit = 1 m, or set dimensions in product 3D fields |
| iOS AR weak / fails | Add a USDZ URL (Quick Look) |

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
