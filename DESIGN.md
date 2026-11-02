# Bevry Billing - Design Document

The design of Bevry Billing, the private invoice portal at `billing.bevry.me`. This file is the evergreen reference: what the system is, what it must do, how it is built, and why the significant choices were made. Time-bound status belongs in `AGENTS.md`, the plan files, or git history. Update this file when a decision changes.

## Purpose

Bevry invoices clients and contractors for development, consulting, sponsorship, education, and related services. The portal gives each entity one private place to read its invoices without an account, a password, or a database.

The system serves two audiences with one record set:

- A client reads the invoices where the client is the receiver of the service.
- A contractor reads the invoices where the contractor is the provider of the service.

The data is real. The invoice, entity, payment method, service, and term records live in `source/data/` and are compiled into the application. That directory is strongbox encrypted in git. The portal has no write surface, no database, and no administration interface. A data change is a source change and a deploy.

## Requirements

Functional:

- A visitor signs in with an email address and a magic link.
- A known email address receives a link. An unknown address receives an error.
- The link verifies the browser session that requested it.
- A signed-in entity reads its own invoices only.
- The entity page lists unpaid and paid invoices, newest first, with a link to each invoice.
- An invoice page shows the provider, the client, the project, the issued date, the due date, the amount, the payments, the item lines, the notes, and the payment methods for the invoice currency.
- An invoice is a tax invoice by default, or a quote when its `type` is `quote`.
- An unpaid invoice shows its payment options. A paid invoice shows its payment state. An overdue invoice shows an overdue warning.
- The amount can include a Goods and Services Tax note when the invoice sets `gst`.
- The pages work without client-side JavaScript.
- The printed invoice is clean: navigation and page chrome are hidden, and the article uses the full page.

Non-functional:

- The login data, the invoice data, and the service credentials never appear in a public file.
- The application remains small enough to read in one sitting: a handful of Worker handlers, one data module per table, and server-rendered React components.
- The deployment is reproducible from the repository plus environment values.
- The data module rejects invalid dates, inconsistent totals, duplicate contact emails, and contradictory payment state at import time.

## Stack

- Cloudflare Workers with static assets from `public/` and a module worker in `worker/`.
- React 19 rendered on the server with `renderToStaticMarkup`.
- TypeScript, with the `source` directory as the module base.
- Tailwind CSS 4 for the sign-in and redirect pages.
- Plain CSS in `public/index.css` for the invoice pages and the print layout.
- `daet` 4 for date parsing, arithmetic, formatting, and comparison.
- Web Crypto (AES-GCM) for the stateless session cookie.
- `wrangler` for local development and deployment.
- Mailgun for email delivery, through its HTTP API.

There is no client framework, no hydration, no API layer, and no database. The request handler reads the compiled records, builds the view for one entity, and returns HTML.

Rejected alternatives:

- A database with accounts and passwords: the record set is small, changes rarely, and has no user-generated content. The source files are the system of record. A database would add a migration path, a backup path, and an access-control surface for no current gain.
- A client-side application: the pages are read-only and benefit from server rendering. Shipping React to the browser would add weight and delay the first readable paint.
- Cloudflare Pages: the platform is deprecated for new projects. The project originally ran on Pages Functions and moved to Workers static assets with the same request logic.

## Request flow

### Session

`source/lib/session.ts` keeps all session state in one AES-GCM encrypted cookie. `source/lib/crypto.ts` provides the random tokens, SHA-256 hashes, AES-GCM encryption, and constant-time comparison.

The cookie has two states:

`awaiting-email-link`:

- `version`: the payload version.
- `state`: `awaiting-email-link`.
- `entityId`: the entity that requested the link, or an empty string.
- `magicLinkTokenHash`: the SHA-256 hash of the token in the email link.
- `createdAt`: when the link was requested.
- `expiresAt`: one hour after `createdAt`.

`signed-in`:

- `version`: the payload version.
- `state`: `signed-in`.
- `entityId`: the signed-in entity.
- `signedInAt`: the original sign-in time.
- `expiresAt`: three days after the last authenticated request.
- `logoutFormToken`: a random value rendered in the logout form.

The cookie stores only the hash of the magic-link token, never the token. The token is in the email link and the confirmation form.

`source/lib/crypto.ts` uses AES-GCM 256 with a 32-byte key from `SESSION_ENCRYPTION_KEY`, a 12-byte random IV per encryption, and the context `billing:session:v1` as additional authenticated data. A missing or malformed key fails at request time.

The cookie is `__Host-billing-session` with `HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=...`. It has no `Domain` attribute. The pending state lasts one hour. The signed-in state lasts three days and is refreshed on every authenticated request.

The session is stateless. There is no session table and no server-side lookup. Key rotation is the revocation control: changing `SESSION_ENCRYPTION_KEY` invalidates every session.

### Sign-in

`worker/index.ts` is the router. It sends `/` and `/login` to `worker/login.tsx`, `/authenticate/<token>` and `/authenticate` to `worker/authenticate.tsx`, `/logout` to `worker/logout.tsx`, and the entity and invoice paths to their handlers. Every other request falls through to `env.ASSETS.fetch(request)`.

- `GET /` and `GET /login` render the form. They do not create a cookie.
- `POST /` and `POST /login` rate-limit the request, normalize the email, look up the entity, create the `awaiting-email-link` cookie, and send the link. Unknown emails receive the same page and status, but no email.
- `GET /authenticate/<token>` decrypts the pending cookie, checks the token hash and expiry, and renders a confirmation page. It does not consume the link.
- `POST /authenticate` repeats the checks and replaces the pending cookie with a `signed-in` cookie. It redirects to `/entity/<entityId>` with `303`.
- `POST /logout` checks the `logoutFormToken` and clears the cookie with `Max-Age=0`.

The magic-link token is 32 random bytes encoded as base64url. The server stores only its SHA-256 hash. The pending cookie binds the link to the browser that requested it. A link opened in a different browser gets the browser-mismatch page, which tells the user to open the link in the original browser or request a new one.

The link is built from `PUBLIC_ORIGIN` when set, then from the browser `Origin` or `Referer` header, then from the request URL. A dev proxy can rewrite the request URL to the production route, so `PUBLIC_ORIGIN` pins the dev server URL and the browser headers preserve it otherwise. The same-origin check trusts `Sec-Fetch-Site` for the same reason: the browser sets it, a page cannot forge it, and it describes the browser's origin rather than the rewritten request URL.

The request endpoint returns the same check-inbox page for known and unknown emails. It sends the email through `ctx.waitUntil`, so the response time does not wait on Mailgun.

The pending state expires after one hour. The signed-in state expires after three days of inactivity and is refreshed on activity. There is no absolute expiry.

### Authorisation

The entity and invoice handlers read the session and require all three conditions:

- The cookie state is `signed-in`.
- `expiresAt` is in the future.
- The session `entityId` equals the `entityId` route parameter.

A valid request refreshes the session cookie with a new `expiresAt` three days in the future. The `signedInAt` and `logoutFormToken` stay the same.

The invoice handler also asks `getDatabase` for the invoice. The database filter accepts only invoices where the route entity is the provider or the client. A valid session for one entity cannot read another entity's invoice.

## Data model

`source/lib/types.d.ts` defines the shapes.

### Entities

An entity has:

- `id`: the map key, added at import.
- `name`: the legal or trading name.
- `website`: optional.
- `contact`: `name`, `email`, and optional `phone`.
- `verification`: an optional map of registration or identity fields. The page renders each field as a table row.
- `address`: optional `street`, `city`, `state`, `country`, and `zip`.

`source/data/entities.ts` adds the map key as `id` and throws when two entities share a contact email. That constraint keeps the email lookup deterministic.

### Invoices

An invoice has:

- `provider` and `client`: entity ids.
- `services`: service ids.
- `currency`: an ISO currency code.
- `project`: a name string or an object with `name` and optional `note`.
- `issued`: a date string.
- `due`: an absolute date string or a tuple of `[amount, unit]` relative to the issue date.
- `amount`: the invoice total.
- `paid`, `payments`, and the payment state.
- `terms`: optional term ids.
- `type`: `quote` or absent for a tax invoice.
- `note`: optional free text.
- `gst`: optional boolean.
- `rate`, `hours`, `days`, `weeks`, `extras`, and `items`: the line-item inputs and results. A rate can be per `hour`, `day`, `week`, or `item`. An item is a name string or an object with a `name` and an optional `amount`; when the rate is per item, a missing amount defaults to the rate amount.

### Inheritance

`InvoicesRaw` allows a full invoice or a child with `inherit` and a partial set of fields.

`fetch` resolves the chain recursively. It merges the parent, clears the payment and line-item fields, applies the child, removes null values, and removes `inherit`. The cleared fields are `paid`, `payments`, `extras`, `items`, `weeks`, `days`, and `hours`. A child therefore inherits the engagement details but starts with a clean payment and item state.

A missing parent throws. This makes a broken inheritance chain a deploy-time failure, not a silent partial invoice.

### Enrichment

`enrich` runs once for each invoice at import:

- An invalid `issued` date throws.
- When a `rate` exists, it builds item lines from `weeks`, `days`, `hours`, or `items` according to `rate.each`, then from `extras` and explicit `items`. A per-item rate supplies the default amount for each item. It sums the total and compares it to `amount`. A zero `amount` is replaced by the computed total. A non-zero amount must match the computed total after rounding, or the import throws.
- Invoices without a rate normalise explicit items and require each item to have an amount.
- A string `paid` date becomes a single payment for the full amount and sets `paid` to true. A string `paid` together with `payments` throws.
- When `payments` exist and `paid` is null, it sums the payments and sets `paid` to whether the rounded sum equals the rounded amount. A currency mismatch throws.
- The project name becomes an object, and `terms` becomes an array when absent.

The checks move data errors to startup. A bad invoice fails the function before it renders a wrong document.

### Database view

`source/data/database.ts` builds a request-local view:

- It sorts invoices by `issued` with `daet`, newest first.
- It filters by the optional `invoiceId`.
- It filters by the optional `entityEmail`.
- It always filters by `entityId`: the invoice must have the entity as provider or client.
- It collects the provider and client entities, the payment methods for each invoice currency, the services, and the terms.
- It records paid and unpaid invoice ids and sums the unpaid amounts.

The current routes use `entityId`, and the invoice route also uses `invoiceId`. The `entityEmail` filter and the `unpaidAmount` total have no current consumer. They stay as small, tested shape for later use.

## Rendering

`sendReact` renders a React element to static HTML and returns a `200` response with `text/html;charset=UTF-8`. Every page is a full HTML document.

Two layouts share the same page shell:

- `layouts/Billing.tsx` loads Normalize.css and `public/index.css`. The invoice and entity pages use it.
- `layouts/Tailwind.tsx` loads the compiled Tailwind stylesheet. The sign-in, confirmation, error, and redirect pages use it.

`public/tailwind.css` imports Tailwind and declares the `source` scan path. The Tailwind 4 CLI compiles it to `public/tailwind.min.css`, which git ignores. `npm start` runs the build through the `prestart` script, and `npm run deploy` runs it through the `predeploy` script, so neither serves a stale stylesheet.

The Worker serves the app routes. All other requests go to the `ASSETS` binding, which serves `public/`. Workers serves a matching static asset before it invokes the Worker, so the CSS and SVG files never reach the router. The app routes have no matching asset, so the router handles them.

`wrangler.jsonc` aliases `start-of-week` to its node export. `daet` 4 imports that package, and its browser export reads `window`, which Workers does not define.

The invoice page renders sections in this order: title, provider, client, project details, invoice details, payment options, and item lines. Payment methods render as one table per currency and location. All fields other than `currency` and `location` render as rows. Terms render in the data view but not on the page.

`Currency` uses `Intl.NumberFormat` with `en-US` and the currency code. A `gst` invoice shows a note that the amount includes the Australian Goods and Services Tax and renders a second amount equal to 10 percent of the total. The stored amount does not change.

`Date` formats with `daet` in English using the long month form. The invoice page calculates the due date from the issue date for relative due values, and marks a due date as overdue when it is in the past.

`public/index.css` also carries the print rules. Printing hides the header and footer, removes the article border and shadow, removes the page background, and sets a 2.5 cm page margin. The invoice is the print artifact.

`sendRedirect` exists in `source/lib/util.ts` and renders a redirect page, but no current route calls it. The login routes return their own `303` responses with a `Location` header.

## Email delivery

`source/lib/mailgun.ts` is the only email module. It uses the Mailgun HTTP API and a plain `fetch`; there is no SDK.

- The endpoint is `${MAILGUN_BASE_URL}/v3/${MAILGUN_DOMAIN}/messages`. The base URL defaults to the US endpoint.
- The body is `FormData` with `from`, `to`, `subject`, `text`, optional `html`, and optional `h:Reply-To`.
- The authorisation header is Basic auth with `api:<MAILGUN_SENDING_KEY>`.
- The request aborts after 15 seconds.
- A non-OK response throws `Mailgun <status>: <body>`.

The sending domain comes from `MAILGUN_DOMAIN`. When that is absent, it comes from the domain part of `MAILGUN_LOGIN`. The sender comes from `EMAIL_FROM`. When that is absent, it is `Bevry Billing <MAILGUN_LOGIN>`. The module throws a clear error when a required value is absent.

The sign-in handler sends a plain-text message with the magic link. Delivery runs in `ctx.waitUntil`, so the response does not wait on Mailgun. A delivery failure logs only `auth.link.failed`, with no token, link, or recipient. The user can request a new link.

SMTP credentials are not used. Cloudflare Workers send over HTTP, so the SMTP login and SMTP password have no role. The Mailgun sending key is the only mail credential the application reads.

## Secret handling

`.gitattributes` declares `filter=strongbox` and `diff=strongbox` for `.dev.vars` and `source/data/*`.

- The committed blob is a strongbox-encrypted resource.
- A checkout with the strongbox filter writes the plaintext to the working tree.
- A commit encrypts the working tree content again.

The public documentation files, the README, the design document, the example environment file, commit messages, issues, and plans are not strongbox encrypted. They must describe the shape of the data and never a value. `.dev.vars.example` therefore names the variables and leaves the values empty. It does not repeat a domain, a mailbox, or a key.

Production values live as Worker secrets. Set them with `wrangler secret put` or in the Cloudflare dashboard. The project does not put them in `wrangler.jsonc`.

## Deployment

`wrangler.jsonc` names the Worker `billing`, points `main` at `worker/index.ts`, sets `assets.directory` to `./public`, and binds the assets as `ASSETS`. It declares the `billing.bevry.me` Workers Custom Domain. `npm run deploy` runs the build, then `wrangler deploy`.

Deployment checklist:

1. Run `npm install`.
2. Remove any existing DNS record for `billing.bevry.me`. The Custom Domain creates its own DNS record and certificate.
3. Run `npm run deploy`.
4. Set `SESSION_ENCRYPTION_KEY` and `MAILGUN_SENDING_KEY` with `wrangler secret put`.
5. Set `MAILGUN_DOMAIN`, `MAILGUN_LOGIN`, `EMAIL_FROM`, or `MAILGUN_BASE_URL` when the defaults do not fit the account.
6. Confirm the sending domain is verified in Mailgun and its DNS records are current.

The Worker serves `public/` through the `ASSETS` binding and handles the app routes in `worker/index.ts`. Workers serves a matching static asset before it invokes the Worker, so the assets do not consume Worker invocations. `workers_dev` stays enabled, so the Worker also answers on its workers.dev hostname.

The Custom Domain creates the DNS record, issues the certificate, and points all paths on the hostname to the Worker. An existing DNS record on the hostname must be removed before the first deploy because Cloudflare will not overwrite an externally managed record.

## Known limits and open questions

- There is no database. A data change is a source edit, a build, and a deploy.
- There is no pagination, search, or filtering in the interface.
- The session is stateless. There is no individual session revocation. Rotating `SESSION_ENCRYPTION_KEY` invalidates every session.
- The session has no absolute expiry. An active session stays signed in until it is idle for three days or the key is rotated.
- The magic link is browser-bound. Opening it in another browser shows the browser-mismatch page and requires a new link.
- The magic link is not strictly single-use across a stolen copy of the pending cookie. Replay is bounded by the one-hour link expiry. A Durable Object could enforce strict single-use later.
- There is no session inventory and no concurrent session limit.
- The invoice page does not render the terms, and the database view does not render the unpaid total.
- `sendRedirect` is unused.
- Relative due dates use `daet` arithmetic. A due date remains a display value; no reminder or late-fee process reads it.
- Currency conversion is not modelled. A payment can carry a different currency, and the page prints that payment's currency. The paid check requires one currency when it derives the state from payments.
- The GST note is a display rule only. The invoice amount is the stored amount.
- There are no automated tests and no CI workflow. The data module is the main guard against bad invoice data.
