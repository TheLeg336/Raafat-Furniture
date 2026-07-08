---
type: moc
tags: [home, start-here]
aliases: [Index, README, Start Here]
---

# Raafat Furniture — Knowledge Base

> **Live site:** https://raafat-furniture.vercel.app  
> **Repo:** Raafat-Furniture (Vite SPA + Express on Vercel)  
> **Last organized:** 2026-07-08

## For agents — read in this order

1. [[Agent Quickstart]] — how to work on this project without breaking money paths
2. [[Stack]] — tech stack and repo layout
3. [[Money Path Invariants]] — **never regress** these
4. [[Roles and Permissions]] — admin / developer / worker
5. [[Environment Variables]] — what must be set on Vercel
6. [[Deploy Checklist]] — Firestore rules paste + redeploy

Then branch by task:

| Task | Start here |
|------|------------|
| Orders / payments | [[Payments]] → [[InstaPay]] |
| Admin email threads | [[Order Messaging]] |
| Images / GLB / scans | [[Cloudinary]] → [[3D and AR]] |
| Analytics | [[GA4 Setup]] |
| Silent bugs | [[Client Errors]] |
| Launch / coming soon | [[Coming Soon]] |

## Maps of content

### Architecture
- [[Stack]]
- [[Money Path Invariants]]
- [[Roles and Permissions]]
- [[Order Lifecycle]]

### Operations
- [[Deploy Checklist]]
- [[Environment Variables]]
- [[Firestore Rules]]

### Features
- [[Payments]]
- [[InstaPay]]
- [[Order Messaging]]
- [[3D and AR]]
- [[Coming Soon]]
- [[Client Errors]]

### Integrations
- [[Cloudinary]]
- [[GA4 Setup]]
- [[Resend Email]]
- [[Stripe and Paymob]]

### History
- [[Changelog 2026-07-08]]

## Key files in repo (not duplicated here)

| Path | Purpose |
|------|---------|
| `CLAUDE.md` | Agent rules (canonical) |
| `firestore.rules` | **Paste into Firebase Console** — do not use Storage |
| `server/ordersApi.ts` | Order creation + pricing |
| `lib/cloudinaryUpload.ts` | All file uploads |
| `lib/clientErrors.ts` | Silent error inbox |
| `constants.ts` | i18n EN + AR keys |

## What we do NOT use

- **Firebase Storage** — files are on [[Cloudinary]] only
- **Cash on pickup** — removed
- **Email/password auth** — Google only
