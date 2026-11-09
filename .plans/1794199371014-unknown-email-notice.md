# Unknown email notice instead of guest sign-in

Assisted-by: OpenCode · DeepSeek V4.1 Flash <opencode-deepseek-deepseekv41flash@local>
Provenance: [prompts companion](./1794199371014-unknown-email-notice.prompts.md)

## Context

The previous change let an unknown address sign in as a guest with an empty invoice list. The new decision reverses that part. Multiple login addresses and email normalisation stay. An unknown address receives a notice email and cannot sign in.

## Decision

- A known primary or additional address receives a magic link and can sign in.
- An unknown address receives the notice email and cannot sign in.
- The check-inbox page stays the same for both cases, so the page does not reveal whether the address is known.
- The notice subject and body are the copy in the prompts companion.

## Session change

Remove the guest email identity from the session payload. A signed-in session must name an entity. The signed-in guard returns false for an empty entity id, so a guest session from the previous deploy is treated as signed out. The session payload version stays `1`, so a valid entity session from before the deploy stays valid.

The login request still creates a pending session for an unknown address. The pending session has an empty entity id and no matching magic link in the email. The confirmation handler requires an entity, so the pending session cannot complete sign-in. The identical response keeps the known and unknown paths indistinguishable to the browser.

## Request flow

### Sign-in request

`worker/login.tsx`:

- Normalise the submitted address and find the entity.
- Send the magic link when the entity exists.
- Send the notice email when the entity is absent. The notice has no link.
- Keep the same per-IP and per-address rate limits.
- Keep the same check-inbox page and status for both cases.

### Confirmation

`worker/authenticate.tsx`:

- Resolve the entity from the pending entity id.
- Return the invalid-link page when the entity is absent.
- Create the signed-in session with the entity id only.

### Invoice pages

`worker/invoices.tsx` and `worker/invoice.tsx`:

- Require a valid entity session.
- Remove the guest invoice list.
- Treat a guest session from the previous deploy as signed out.

## Rendering changes

`source/pages/Invoices.tsx`:

- Restore the required `Entity` viewer.
- Remove the guest copy and the optional viewer.

`source/pages/Login.tsx`:

- Replace the "magic email" wording with neutral email wording. The same page then fits a link and a notice.

## File impact

| File                        | Change                                                                                 |
| --------------------------- | -------------------------------------------------------------------------------------- |
| `source/lib/session.ts`     | Remove the optional email field. Require a non-empty entity id in the signed-in guard. |
| `worker/login.tsx`          | Send a magic link for a known address and a notice for an unknown address.             |
| `worker/authenticate.tsx`   | Require an entity for confirmation and sign-in.                                        |
| `worker/invoices.tsx`       | Remove the guest list and require an entity viewer.                                    |
| `source/pages/Invoices.tsx` | Restore the required entity viewer.                                                    |
| `source/pages/Login.tsx`    | Use neutral email wording.                                                             |
| `source/pages/Confirm.tsx`  | Restore the entity name prop.                                                          |
| `source/data/database.ts`   | Keep the empty-viewer guard with a general comment.                                    |
| `DESIGN.md`                 | Replace the guest sign-in description with the notice behaviour.                       |
| `README.md`                 | Replace the guest sign-in notes with the notice behaviour.                             |
| `.plans/...`                | This plan and the prompts companion.                                                   |

## Rollout and compatibility

- No environment value changes.
- No data migration.
- A valid entity session from the previous deploy stays valid.
- A guest session from the previous deploy becomes invalid because its entity id is empty.
- An unknown address can request the notice more than once, subject to the rate limits.

## Verification

1. Run `npm run typecheck`.
2. Run `npm run build`.
3. Request a link for a known primary address. Confirm the magic link opens the entity list.
4. Request a link for the Tip Stevens additional address. Confirm the magic link opens the same entity list.
5. Request an email for an unknown address. Confirm the notice arrives and has no link.
6. Confirm an unknown address cannot complete sign-in.
7. Confirm a guest session from the previous deploy redirects to sign-in.
8. Confirm the check-inbox page and status are the same for known and unknown addresses.
9. Confirm an invalid address returns `400`.
10. Run `wrangler deploy --dry-run`.

## Risks and limits

- An unknown address can cause an outbound notice email. The rate limits and the one-hour pending state bound the effect.
- The notice email is plain text and has no reply address. The copy tells the reader not to reply.
- The ASCII dot-atom email subset still rejects some legal RFC forms. The design document states this limit.
