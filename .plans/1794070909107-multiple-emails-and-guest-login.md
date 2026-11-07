# Multiple entity emails and guest sign-in

Assisted-by: OpenCode · DeepSeek V4.1 Flash <opencode-deepseek-deepseekv41flash@local>
Provenance: [prompts companion](./1794070909107-multiple-emails-and-guest-login.prompts.md)

## Context

Bevry Billing matches one email address to one entity. The entity record has one contact email. The sign-in handler sends no email when the address is unknown. A signed-in session stores only an entity id. The invoice list renders the entity name.

The change has three parts:

- an entity can have more than one login address;
- an unknown address can sign in and read an empty list;
- every address is normalised before a lookup or a comparison.

## Goals

- Accept one primary contact address and zero or more additional login addresses for each entity.
- Add one additional production address for Tip Stevens in the strongbox data.
- Send a magic link to a known or unknown address.
- Sign a guest in with an email identity.
- Render `Welcome <email>,` and `you have no invoices.` for a guest.
- Return every address in lowercase and in one canonical form.
- Reject an address that cannot pass the normalisation contract.
- Keep the current privacy rule: the request page does not reveal whether an address is known.

## Non-goals

- Do not show additional addresses on an invoice.
- Do not add a database, an account record, or an administration page.
- Do not add an email validation dependency.
- Do not add a test framework.
- Do not change the invoice authorisation for a known entity.
- Do not support quoted local parts, address literals, or internationalised domains.

## Entity email schema

### Options

| Option | Shape                                                              | Benefits                                                                      | Costs                                                                               |
| ------ | ------------------------------------------------------------------ | ----------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| A      | `contact.emails: string[]` with the primary address first          | One field holds every address                                                 | The code must remember that index zero is special. A missing list means no address. |
| B      | `contact.email: string` plus `contact.additionalEmails?: string[]` | The primary address keeps its current role. The extra addresses are explicit. | Two fields hold login addresses.                                                    |
| C      | `contact.email: string \| string[]`                                | The field name stays the same.                                                | Every reader needs a union branch. The display code needs a separate primary rule.  |

Choose option B. The primary address stays in `contact.email`. The additional login addresses go in `contact.additionalEmails`. The invoice display keeps one contact address. The sign-in lookup uses the union of the two fields.

Example shape, with placeholder values:

```ts
contact: {
  name: 'Contact name',
  email: 'primary@example.com',
  additionalEmails: ['additional@example.com'],
}
```

### Import rules

`source/data/entities.ts` normalises every primary and additional address at import. The import fails when an address is invalid. The import fails when any address appears twice, in one entity or across entities. The failure message names the entity id and never the address.

The import writes the normalised address back into the entity. The display code therefore shows lowercase addresses. The data values never leave the strongbox source except through the application.

## Guest identity

### Options

| Option | Shape                                                                                                                        | Benefits                                                                                      | Costs                                                                                                          |
| ------ | ---------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| A      | Add an optional `email` to the pending and signed-in session. An unknown identity has an empty `entityId` and a set `email`. | One session mechanism. Existing entity sessions keep their shape. The cookie stays stateless. | Every reader must handle the empty entity id.                                                                  |
| B      | Add a temporary entity for each unknown address                                                                              | The invoice code keeps one identity type.                                                     | The entity table becomes writable. The duplicate-email check and the invoice filters must handle fake records. |
| C      | Add a second guest cookie and a second session path                                                                          | The entity session stays unchanged.                                                           | Two session mechanisms, two expiry rules, and two authorisation paths.                                         |

Choose option A. The session gains an optional `email` field. A new pending session always records the normalised address. A new signed-in session records the same address and the matching entity id, or an empty entity id. The payload version stays `1` because the field is additive. An existing cookie without `email` stays valid.

A known entity is a session with a non-empty `entityId` that resolves to an entity. A guest is a session with an empty `entityId` and a valid `email`. Any other session is invalid for an invoice page.

## Email normalisation contract

`source/lib/email.ts` exports `normaliseEmail(value: string): string | null`.

The function performs these steps:

1. Trim the input.
2. Reject an empty value.
3. Reject a value longer than 254 bytes.
4. Reject a control character or any whitespace inside the value.
5. Split at the last `@`. Reject a missing local part or a missing domain.
6. Require a dot-atom local part of at most 64 characters. A dot cannot lead, trail, or repeat.
7. Require one or more domain labels. Each label has 1 to 63 letters, digits, or hyphens. A hyphen cannot lead or trail.
8. Convert the address to lowercase.
9. Return the canonical address.

The function rejects quoted local parts, address literals, and non-ASCII characters. These forms are legal in some RFC contexts, but no entity uses them and the portal does not need them. The design document will state this limit.

The login handler normalises the submitted address before the lookup and before the rate-limit hash. The data import uses the same function. One contract covers both paths.

## Request flow changes

### Sign-in request

`worker/login.tsx`:

- Normalise the submitted address. Return `400` when the address is invalid.
- Find the entity with the union of the primary and additional addresses.
- Create the pending session with the entity id, or with an empty id, and with the normalised address.
- Send the magic link to the submitted address. Use the contact name in the display name when an entity matches.
- Keep the current per-IP and per-address rate limits. Keep the same check-inbox page for known and unknown addresses.

### Magic-link confirmation

`worker/authenticate.tsx`:

- Resolve the entity from the pending entity id. If that fails, resolve it from the pending email. This picks up an entity that was added after the link request.
- Accept a pending session when it has an entity or a valid email. Reject it when it has neither.
- Render the confirmation page with the entity name or the email.
- Create the signed-in session with the resolved entity id, or with an empty id, and the email.
- Keep the token hash, expiry, same-origin, and browser-binding checks.

### Invoice list

`worker/invoices.tsx`:

- `/invoices/`: render the entity list when the entity resolves. Render the guest list when the entity id is empty and the email exists. Return `404` when an entity id is stale or both identities are absent.
- `/invoices/<entityId>`: an entity filter. A guest receives `404` because a guest has no entity to filter.

`worker/invoice.tsx`:

- An invoice page. A guest receives `404` because a guest is not a party to any invoice. The current entity lookup already does this. The plan adds an explicit test for the path.

### Refresh and logout

The existing refresh copies the whole session, so it keeps the email. Logout already clears the cookie for every session state.

## Rendering changes

`source/pages/Invoices.tsx`:

- Accept `viewer: Entity | null` and `viewerEmail?: string`.
- Use the entity name for a known viewer and the email for a guest.
- Render `Welcome <name>,` and `here are your invoices` for a known viewer.
- Render `Welcome <email>,` and `you have no invoices.` for a guest.
- Render the current `There are no invoices to show.` section only for a known viewer.

`source/pages/Confirm.tsx`:

- Rename `entityName` to `identityName`. The value is the entity name or the email.

The HTML escaping from React covers the email in the page. The email helper rejects control characters, so the Mailgun form values cannot carry a newline.

## Security and privacy

- A known and an unknown address receive the same check-inbox page and status. The page still does not reveal whether an address is known.
- An unknown address can request a link. The per-IP and per-address rate limits bound abuse. The link still expires after one hour and binds to the requesting browser.
- An additional address is a full login alias. A person who controls it can read the entity invoices. Add only trusted addresses.
- The session stores the normalised email. The cookie is encrypted and authenticated.
- The data import rejects invalid and duplicate addresses before deployment.
- The plan and the public documents do not quote entity data values.

## File impact

| File                        | Change                                                                                                         |
| --------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `source/lib/types.d.ts`     | Add `additionalEmails?: string[]` to the entity contact.                                                       |
| `source/lib/email.ts`       | New module. Export `normaliseEmail`.                                                                           |
| `source/data/entities.ts`   | Normalise and validate every address. Add the Tip Stevens additional address in the strongbox record.          |
| `source/data/database.ts`   | Match the union of the primary and additional addresses. Return an empty database when the viewer id is empty. |
| `source/lib/session.ts`     | Add optional `email`. Extend the create functions and the session validator.                                   |
| `worker/login.tsx`          | Normalise the address, find the entity, send to the submitted address, record the email.                       |
| `worker/authenticate.tsx`   | Resolve an entity or a guest, render the identity, create the guest session.                                   |
| `worker/invoices.tsx`       | Render the guest list at `/invoices/`. Return `404` for a guest filter.                                        |
| `worker/invoice.tsx`        | Confirm the guest `404` path. No functional change is expected.                                                |
| `source/pages/Invoices.tsx` | Accept a guest viewer. Render the guest copy.                                                                  |
| `source/pages/Confirm.tsx`  | Rename the identity prop.                                                                                      |
| `DESIGN.md`                 | Update the requirements, sign-in flow, entity model, authorisation, and known limits.                          |
| `README.md`                 | Update the how-it-works notes.                                                                                 |
| `.plans/...`                | This plan and the prompts companion.                                                                           |

## Rollout and compatibility

- No environment value changes.
- No database migration.
- Existing sessions stay valid because `email` is optional in the payload.
- A new deploy reads the normalised source data. The strongbox filter encrypts the data commit as usual.
- A guest can sign out and request a new link with another address.

## Verification

Run these checks after the build:

1. `npm run typecheck`
2. `npm run build`
3. Request a link with an uppercase address that has surrounding spaces. Confirm the check-inbox page shows the lowercase address.
4. Request a link for a known primary address. Confirm the entity list opens.
5. Request a link for the Tip Stevens additional address. Confirm the same entity list opens.
6. Request a link for an unknown address. Confirm the link arrives, the confirmation page shows the address, and the list page shows `Welcome <email>,` and `you have no invoices.`
7. Open `/invoices/<entityId>` and `/invoice/<invoiceId>` as a guest. Confirm the `404` page.
8. Open an invalid address such as an address without `@`, an address with a space, and an address with a leading dot. Confirm `400`.
9. Use an existing signed-in cookie from before the deploy. Confirm it still reaches the entity list.
10. Sign out from a guest session. Confirm the login page returns.

## Implementation order

1. Add the email helper and the entity schema.
2. Normalise and validate the data. Add the additional address.
3. Update the entity lookup.
4. Extend the session.
5. Update the sign-in and confirmation handlers.
6. Update the invoice handlers and the invoice list page.
7. Update the design document and the README.
8. Run the verification checks.

## Risks and limits

- Lowercasing the local part is not strictly RFC compliant for a case-sensitive server. Every mainstream provider treats the local part as case-insensitive. The portal already lowercased the submitted address.
- The ASCII dot-atom subset rejects some legal RFC forms. The design document will state this limit.
- An unknown address can now cause an outbound email. Rate limits and the one-hour link expiry bound the effect.
- There is still no test framework. The import checks and the manual checks are the guard.
