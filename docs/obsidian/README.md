# Obsidian vault — Raafat Furniture

This folder is the **agent-readable knowledge base** for the project.

## Open in Obsidian

**Option A — from repo (recommended for agents + git):**
```
C:\Users\youss\Downloads\Raafat-Furniture-main\docs\obsidian
```

**Option B — OneDrive mirror (synced copy):**
```
C:\Users\youss\OneDrive\Documents\Obsidian Vault\Raafat-Furniture
```

## Start here

Open **[[Home]]** in Obsidian graph view to see connections.

Agents without Obsidian: read `Home.md` then `Agent Quickstart.md` in this folder.

## Sync

Repo is source of truth. After edits in repo, run from project root:

```powershell
.\scripts\sync-obsidian-vault.ps1
```

Or copy `docs/obsidian/*.md` to your OneDrive vault manually.

## Structure

| Note | Topic |
|------|-------|
| [[Home]] | Master index |
| [[Agent Quickstart]] | Onboarding |
| Architecture notes | Stack, money path, roles |
| Operations | Deploy, env, Firestore |
| Features | Payments, 3D, errors, coming soon |
| Integrations | Cloudinary, GA4, Resend, Stripe |

## Do not duplicate

- `firestore.rules` — use repo file, paste into Firebase Console
- `CLAUDE.md` — canonical agent rules at repo root
