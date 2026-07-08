---
type: guide
tags: [agent, onboarding]
---

# Agent Quickstart

## Before you change code

1. Read [[Money Path Invariants]] — order prices, tax, and payment flows are server-enforced.
2. Read [[Roles and Permissions]] — developer = full admin + Dev tools.
3. Confirm file hosting: [[Cloudinary]] only (not Firebase Storage).

## Commands

```bash
npm run dev    # localhost:3000
npm run lint   # tsc --noEmit (must pass)
npm run build  # vite → dist/
```

## Safe areas vs sensitive areas

| Safe-ish | Sensitive — review carefully |
|----------|------------------------------|
| i18n keys in `constants.ts` | `server/ordersApi.ts` |
| Admin UI polish | `firestore.rules` |
| Legal copy placeholders | Stripe / Paymob webhooks |
| GA event wiring | `POST /api/orders/create` |

## Deploy workflow (owner)

1. Paste `firestore.rules` from repo → Firebase Console → Firestore → Rules → Publish  
   See [[Firestore Rules]] and [[Deploy Checklist]].
2. Set env vars on Vercel — see [[Environment Variables]].
3. Push to `main` → Vercel auto-deploys.

## Common pitfalls

- **GLB upload fails** → Cloudinary unsigned preset must allow **Raw** resource type. See [[Cloudinary]].
- **"Insufficient permissions" on catalog** → `admins/{email}` doc with role `developer` or `admin`; paste latest [[Firestore Rules]].
- **InstaPay** → customer puts `{orderNumber} {fullName}` in transfer note. See [[InstaPay]].
- **Coming soon** → team (admin/worker/dev) bypasses; signed-in customers still blocked; show **Log out**. See [[Coming Soon]].

## Related

- [[Home]]
- [[Stack]]
- [[Changelog 2026-07-08]]
