---
type: feature
tags: [launch, coming-soon]
---

# Coming Soon

Full-page overlay when launch mode is on.

## Who bypasses

- `isAdmin` or `isWorker` or developer (team)
- Allowlisted routes always open: `/sign-in`, `/checkout`, `/order/confirmation`, `/track`

## Who is blocked

- Anonymous visitors
- Signed-in **customers** (still see overlay)

## Sign-in UX

- Not signed in → link: "Team member? Sign in"
- Signed in as customer (not team) → **Log out** button instead

## Controls

**Admin → Dev** → Coming soon mode toggle + waitlist + Launch

- API: `server/launchApi.ts` (developer only)
- Firestore: `settings/launch`

## Related

- [[Roles and Permissions]]
- [[Deploy Checklist]]
- [[Resend Email]] (launch blast)
