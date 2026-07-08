---
type: architecture
tags: [auth, roles, security]
---

# Roles and Permissions

Staff roles live in Firestore `admins/{email}` (lowercase email as doc ID).

## Roles

| Role | Access |
|------|--------|
| **developer** | Everything **admin** has + team management + `admin_logs` read + scan delete + Dev tab + [[Client Errors]] inbox |
| **admin** | Catalog, orders, scans, reviews, analytics, settings |
| **worker** | `/staff` only via `/api/worker/*` — spec checklists, **no** prices or customer PII (server-enforced) |

Aliases accepted in rules: `dev` → developer

## Bootstrap

`youssefhanna336@gmail.com` (verified) = developer until `admins/{email}` doc exists.

## Firestore gates

- `isAdmin()` → admin **or** developer (or bootstrap dev)
- `isDeveloper()` → developer only (team writes, `client_errors` read, scan delete)

## File uploads

- All uploads via [[Cloudinary]] unsigned preset (browser)
- No Firebase Storage — not a permissions issue, by design

## Client auth

- Google-only sign-in (`pages/Login.tsx`)
- Unknown role strings → fail closed (no admin escalation)

## Related

- [[Firestore Rules]]
- [[Agent Quickstart]]
- [[3D and AR]] (scan requires admin/dev)
