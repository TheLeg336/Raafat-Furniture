# Raafat Furniture — project memory (Obsidian + agents)

## Live
- https://raafat-furniture.vercel.app
- Stack: React 19 + Vite + Firebase + Express on Vercel

## Roles
- `developer` = full admin powers (catalog, orders, uploads, scans) **plus** team + Dev tools + error inbox
- `admin` = catalog/orders/reviews/analytics
- `worker` = `/staff` API only (no Storage/Firestore admin writes)
- Bootstrap: `youssefhanna336@gmail.com` (verified)

## Known issues fixed (2026-07-08)
- Scan "Start camera" crash: safer getUserMedia fallbacks, portal overlay z=2100 above nav, attach stream after video mounts
- Dev GLB upload "insufficient permissions": Storage rules accept admin|developer|dev; explicit `model/gltf-binary` contentType; clearer error if rules not deployed
- Coming soon: signed-in non-team users see **Log out** instead of "Team member? Sign in"
- Admin nav: Analytics (BarChart3) + Reviews (Star) icons; Dev badge for unresolved client errors
- Silent error inbox: `client_errors` + Dev → Errors panel
- Home scroll "clip to section": removed ProductSection sticky snap; hero slightly under full viewport; overflow-anchor off

## Files vs database
- **Cloudinary** — product images, GLB models, scan frames (unsigned preset; allow Raw for GLB)
- **Firestore** — all app data / metadata only. Paste `firestore.rules` in Firebase Console.
- **Do not use Firebase Storage** for this project.

## Deploy reminders
Paste `firestore.rules` into Firebase Console → Firestore → Rules → Publish.
Vercel env still needed: GA, Resend, FIREBASE_SERVICE_ACCOUNT, Stripe/Paymob, Cloudinary

## Graphify / MemPalace / Obsidian
- `.planning/config.json`: graphify.enabled + mempalace.enabled (wing: raafat-furniture)
- Graph built via `graphify update .` → `graphify-out/` (gitignored; rebuild locally)
- Obsidian vault sync: `OneDrive/Documents/Obsidian Vault/Raafat-Furniture/` (Index, MEMORY, docs)
- Repo memory: `.planning/MEMORY.md` + `docs/`
