---
type: feature
tags: [errors, dev, monitoring]
aliases: [Client Errors, Error Inbox, ERROR-REPORTING]
---

# Client Errors

Silent technical error reporting for developers.

## UI

**Admin → Dev → Errors** tab

- Badge on Dev nav when unresolved errors exist
- **Mark completed** clears item

## Storage

Firestore collection: `client_errors`

Rules: anyone can create (tight schema); only [[Roles and Permissions|developer]] can read/update.

Paste rules: [[Firestore Rules]]

## Code

- `lib/clientErrors.ts` — report + subscribe
- `components/ErrorBoundary.tsx` — React errors
- `App.tsx` — `window.onerror` + unhandledrejection

## Collected

- Message, stack (truncated)
- Path (where they were), intended path
- User-agent, signed-in hint, role hint

## NOT collected

- Form values, payments, passwords, camera frames

## Legal

Documented in `lib/legalContent.ts` — legitimate interest / necessary diagnostics.

Details: repo `docs/ERROR-REPORTING.md`

## Related

- [[Roles and Permissions]]
- [[Firestore Rules]]
- [[Agent Quickstart]]
