# Silent client error reporting

## What it is
The storefront silently records technical failures into Firestore `client_errors`.
Developers open **Admin → Dev → Errors**, see a badge for unresolved items, and mark them **Completed**.

Customers never see a toast, modal, or banner from this system.

## What is collected
- Error message + truncated stack
- Current path (`where they were`)
- Optional intended path (`where they were trying to go`) when known
- Coarse user-agent + browser language
- Whether the visitor was signed in / role hint (customer|admin|developer|worker)

## What is NOT collected
- Form field values, passwords, payment card data, InstaPay references
- Camera frames or scan images
- Precise GPS / IP (Firestore may log IP at the infrastructure layer; we do not store it in the report doc)
- Analytics marketing identifiers

## Legal basis
Documented in `lib/legalContent.ts` (Privacy + Cookie policies):
- **Legitimate interests** in keeping the store reliable and secure
- Treated as **strictly necessary reliability diagnostics**, not consent-gated analytics advertising

## Deploy
Paste the contents of `firestore.rules` into Firebase Console → Firestore Database → Rules → Publish.

Create rules allow anonymous creates with a tight schema; only developers can read/update/delete.
