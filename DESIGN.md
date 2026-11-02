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
- A verified entity reads its own invoices only.
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
- React 18 rendered on the server with `renderToStaticMarkup`.
- TypeScript, with the `source` directory as the module base.
- Tailwind CSS for the sign-in and redirect pages.
- Plain CSS in `public/index.css` for the invoice pages and the print layout.
- `daet` for date parsing, arithmetic, formatting, and comparison.
- `webcrypt-session` for the encrypted session cookie.
- `zod` for the session payload schema.
- `wrangler` for local development and deployment.
- Mailgun for email delivery, through its HTTP API.

There is no client framework, no hydration, no API layer, and no database. The request handler reads the compiled records, builds the view for one entity, and returns HTML.

Rejected alternatives:

- A database with accounts and passwords: the record set is small, changes rarely, and has no user-generated content. The source files are the system of record. A database would add a migration path, a backup path, and an access-control surface for no current gain.
- A client-side application: the pages are read-only and benefit from server rendering. Shipping React to the browser would add weight and delay the first readable paint.
- Cloudflare Pages: the platform is deprecated for new projects. The project originally ran on Pages Functions and moved to Workers static assets with the same request logic.

## Request flow

### Session

`source/lib/util.ts` creates the session with `createWebCryptSession` and a `zod` schema:

- `entityId`: the entity that requested the link, or an empty string.
- `verified`: whether the link has been opened.
- `token`: the magic-link token.
- `userAgent`: the requesting browser's `User-Agent`.

The session is encrypted with `SESSION_PASSWORD`. A missing password throws at request time.

`getCookieHeaderValue` writes the cookie as `Secure; Path=/; Domain=<hostname>`. The cookie is not `HttpOnly` and has no explicit `SameSite` attribute. The current design relies on the encrypted payload and the user-agent check, not on script isolation.

### Sign-in

`worker/index.ts` is the router. It sends `/`, `/login`, `/logout`, and `/authenticate/*` to `worker/login.tsx`. It sends `/entity/<entityId>` to `worker/entity.tsx` and `/entity/<entityId>/invoice/<invoiceId>` to `worker/invoice.tsx`. Every other request falls through to `env.ASSETS.fetch(request)`.

- `GET /` and `GET /login` create or reuse a token, save the session with an empty entity, and render the form. The response sets the session cookie.
- `POST /` and `POST /login` read the `email` form field, find the entity whose contact email matches exactly, save the entity id and token in the session, build `/authenticate/<token>`, and send the link.
- `GET /authenticate/<token>` checks that the `User-Agent` matches the session, checks the token, sets `verified` to true, and redirects to `/entity/<entityId>` with a `303` response and a `Location` header.
- `/logout` saves an empty session and redirects to `/` with a `303` response.

The token is `Math.random().toString(36).slice(2)`. The session stores it before the email is sent. The user agent check means the link works only in the browser that requested it. A user-agent change, such as a browser upgrade or a mobile handoff, makes the link fail.

The form returns `401 unauthorized` for an unknown email and a success page for a known email. That difference reveals whether an address is known. Rate limiting, token expiry, and single-use links are not implemented.

### Authorisation

The entity and invoice handlers read the session and require all three conditions:

- `verified` is true.
- The request `User-Agent` equals the session `userAgent`.
- The session `entityId` equals the `entityId` route parameter.

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
- `rate`, `hours`, `days`, `weeks`, `extras`, and `items`: the line-item inputs and results.

### Inheritance

`InvoicesRaw` allows a full invoice or a child with `inherit` and a partial set of fields.

`fetch` resolves the chain recursively. It merges the parent, clears the payment and line-item fields, applies the child, removes null values, and removes `inherit`. The cleared fields are `paid`, `payments`, `extras`, `items`, `weeks`, `days`, and `hours`. A child therefore inherits the engagement details but starts with a clean payment and item state.

A missing parent throws. This makes a broken inheritance chain a deploy-time failure, not a silent partial invoice.

### Enrichment

`enrich` runs once for each invoice at import:

- An invalid `issued` date throws.
- When a `rate` exists, it builds item lines from `weeks`, `days`, or `hours`, then from `extras` and explicit `items`. It sums the total and compares it to `amount`. A zero `amount` is replaced by the computed total. A non-zero amount must match the computed total after rounding, or the import throws.
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
- `layouts/Tailwind.tsx` loads the compiled Tailwind stylesheet and the Flowbite stylesheet and script from a CDN. The sign-in and redirect pages use it.

`public/tailwind.css` is the Tailwind source. `npm run build` compiles it to `public/tailwind.min.css`, which git ignores. `npm start` runs the build through the `prestart` script, so a local start never serves a stale stylesheet. A deploy must run the build first; `npm run deploy` does not include the build step, so run `npm run build` before `npm run deploy`.

The Worker serves the app routes. All other requests go to the `ASSETS` binding, which serves `public/`. Workers serves a matching static asset before it invokes the Worker, so the CSS and SVG files never reach the router. The app routes have no matching asset, so the router handles them.

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

The sign-in handler sends a plain-text message with the magic link. When delivery fails, the handler writes the magic link to the console, returns `502` with the Mailgun error, and keeps the session cookie. The console write helps local diagnosis. It is not a production recovery path.

SMTP credentials are not used. Cloudflare Workers send over HTTP, so the SMTP login and SMTP password have no role. The Mailgun sending key is the only mail credential the application reads.

## Secret handling

`.gitattributes` declares `filter=strongbox` and `diff=strongbox` for `.dev.vars` and `source/data/*`.

- The committed blob is a strongbox-encrypted resource.
- A checkout with the strongbox filter writes the plaintext to the working tree.
- A commit encrypts the working tree content again.

The public documentation files, the README, the design document, the example environment file, commit messages, issues, and plans are not strongbox encrypted. They must describe the shape of the data and never a value. `.dev.vars.example` therefore names the variables and leaves the values empty. It does not repeat a domain, a mailbox, or a key.

Production values live as Worker secrets. Set them with `wrangler secret put` or in the Cloudflare dashboard. The project does not put them in `wrangler.jsonc`.

## Deployment

`wrangler.jsonc` names the Worker `billing`, points `main` at `worker/index.ts`, sets `assets.directory` to `./public`, and binds the assets as `ASSETS`. It also declares the `billing.bevry.me` custom domain and the matching zone route. `npm run deploy` runs the build, then `wrangler deploy`.

Deployment checklist:

1. Run `npm install`.
2. Release the `billing.bevry.me` custom domain from the old Pages project.
3. Run `npm run deploy`.
4. Set `SESSION_PASSWORD` and `MAILGUN_SENDING_KEY` with `wrangler secret put`.
5. Set `MAILGUN_DOMAIN`, `MAILGUN_LOGIN`, `EMAIL_FROM`, or `MAILGUN_BASE_URL` when the defaults do not fit the account.
6. Confirm the sending domain is verified in Mailgun and its DNS records are current.

The Worker serves `public/` through the `ASSETS` binding and handles the app routes in `worker/index.ts`. Workers serves a matching static asset before it invokes the Worker, so the assets do not consume Worker invocations. `workers_dev` stays enabled, so the Worker answers before the custom domain cutover.

The custom domain provisions its DNS record and certificate through Wrangler. The zone route carries the traffic and protects the hostname from another Worker's wildcard route. The old Pages project must release the custom domain first, or the two projects conflict.

## Known limits and open questions

- There is no database. A data change is a source edit, a build, and a deploy.
- There is no pagination, search, or filtering in the interface.
- The sign-in flow reveals whether an email is known.
- The flow has no rate limit, no token expiry, and no single-use link. The token lives in the encrypted session until the session changes.
- The cookie is `Secure` but not `HttpOnly` and has no explicit `SameSite` value.
- The sign-in form has no CSRF token.
- A failed mail delivery prints the magic link to the server console and returns the Mailgun error text to the browser.
- The invoice page does not render the terms, and the database view does not render the unpaid total.
- `sendRedirect` is unused.
- The Tailwind page loads Flowbite from a CDN even though the current page does not use its components.
- Relative due dates use `daet` arithmetic. A due date remains a display value; no reminder or late-fee process reads it.
- Currency conversion is not modelled. A payment can carry a different currency, and the page prints that payment's currency. The paid check requires one currency when it derives the state from payments.
- The GST note is a display rule only. The invoice amount is the stored amount.
- There are no automated tests and no CI workflow. The data module is the main guard against bad invoice data.
