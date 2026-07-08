---
type: integration
tags: [analytics, ga4]
aliases: [GA4 Setup, Google Analytics]
---

# GA4 Setup

App is wired; you only need a Measurement ID.

## Steps

1. analytics.google.com → Create property **Raafat Furniture**
2. Web stream → `https://raafat-furniture.vercel.app`
3. Copy `G-XXXXXXXX`
4. Vercel → `VITE_GA_MEASUREMENT_ID` → redeploy

Full checklist: repo `docs/GA4-SETUP.md`

## What the site does

- gtag loads **only** after analytics cookie consent
- Consent Mode v2 (denied until granted)
- `anonymize_ip`
- Events: `page_view`, `view_item`, `add_to_cart`, `begin_checkout`, `purchase`

## Admin

**Admin → Analytics** — Firestore order sales + GA status (works without GA configured).

## Metrics tip

Use **Active users**, not raw page views, for unique visitors.

## Related

- [[Environment Variables]]
- [[Deploy Checklist]]
