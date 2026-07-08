---
type: operations
tags: [firestore, security, rules]
---

# Firestore Rules

## How to deploy

**Paste only** — no CLI required:

1. Copy entire `firestore.rules` from repo root
2. Firebase Console → Firestore Database → Rules → Publish

## What the rules govern

Firestore **documents only**. Files are on [[Cloudinary]].

## Collections (summary)

| Collection | Read | Write |
|------------|------|-------|
| `products`, `categories`, `settings` | public / admin | admin+dev |
| `orders` | owner or admin | server create; admin update |
| `orderNumbers` | — | server only |
| `users/{uid}` | owner or admin | owner |
| `admins/{email}` | self or admin | developer only |
| `scans` | admin+dev | admin+dev create/update; dev delete |
| `client_errors` | dev | anyone create (schema); dev update |
| `launch_waitlist` | — | server only |

## Role helpers

- `isAdmin()` — bootstrap dev OR `admin` OR `developer` OR `dev`
- `isDeveloper()` — bootstrap dev OR `developer` OR `dev`
- Workers → **no** Firestore admin access

## Money path

- `orders` → `allow create: if false` (server Admin SDK only)

## Related

- [[Roles and Permissions]]
- [[Money Path Invariants]]
- [[Client Errors]]
- [[Deploy Checklist]]
