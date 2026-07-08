# Google Analytics 4 — setup checklist

The app is already wired for GA4 (consent-gated). You only need a Measurement ID.

## 1. Create the property
1. Go to https://analytics.google.com/
2. Admin → Create Property → name it **Raafat Furniture**
3. Time zone: Egypt / Cairo; currency: EGP (or USD if you prefer reporting in USD)
4. Create a **Web** data stream
5. Website URL: `https://raafat-furniture.vercel.app`
6. Copy the **Measurement ID** (`G-XXXXXXXX`)

## 2. Add to Vercel
1. Vercel → Project → Settings → Environment Variables
2. Add `VITE_GA_MEASUREMENT_ID` = `G-XXXXXXXX` (Production + Preview)
3. Redeploy

## 3. What the site already does
- Injects gtag only after the user accepts **analytics** cookies
- Consent Mode v2 defaults (denied until granted)
- `anonymize_ip`
- Page views on route change
- Helpers ready: `view_item`, `add_to_cart`, `begin_checkout`, `purchase`

## 4. Unique visitors (not inflated page views)
In GA4 use **Reports → Acquisition → User acquisition → Active users** (or Explorations with “Active users”).
Do **not** use raw “Views” as your people count.

## 5. Admin UI
After deploy, open **Admin → Analytics**. It shows sales (day/month/year) from orders, plus a link/status for GA.
