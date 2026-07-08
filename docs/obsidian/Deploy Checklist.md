---
type: operations
tags: [deploy, firestore]
---

# Deploy Checklist

## 1. Firestore rules (required)

1. Open repo file `firestore.rules`
2. Firebase Console → **Firestore Database** → **Rules**
3. Select all → paste → **Publish**

Details: [[Firestore Rules]]

**Do not deploy `storage.rules`** — we use [[Cloudinary]] only.

## 2. Vercel environment

Set all vars from [[Environment Variables]] for Production (+ Preview if desired).

Minimum for orders to work:
- `FIREBASE_SERVICE_ACCOUNT`
- `SITE_URL=https://raafat-furniture.vercel.app`
- Cloudinary: `VITE_CLOUDINARY_*`

## 3. Git push

```bash
git push origin main
```

Vercel auto-deploys from `main`.

## 4. Post-deploy smoke

- Home / shop load
- `/track` form
- `/sign-in` Google-only
- Admin routes (team sign-in)
- Cookie consent → optional GA

## 5. Optional integrations

| Integration | Doc |
|-------------|-----|
| GA4 | [[GA4 Setup]] |
| Email | [[Resend Email]] |
| Stripe | [[Stripe and Paymob]] |

## Related

- [[Home]]
- [[Agent Quickstart]]
