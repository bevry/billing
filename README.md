# Bevry Billing

The private invoice portal for Bevry. A client or contractor signs in with a magic link, then reads unpaid invoices, paid invoices, invoice details, and payment options.

The invoice and contact records are real. They compile into the application from strongbox-encrypted source files. Design decisions live in [DESIGN.md](./DESIGN.md).

## How it works

- Cloudflare Workers serves the static assets and runs the app router in `worker/`.
- The sign-in form normalises the email address and matches it to a known entity. A matching entity receives a magic link by email. An entity can have additional login addresses. An unknown address also receives a link, and signs in to an empty list.
- Known and unknown addresses receive the same check-inbox page and status. The request page does not reveal whether an address is known.
- A guest sees its address and the message that it has no invoices.
- The link opens a confirmation page in the browser that requested it. The signed-in session lasts three days without activity.
- The link verifies the session in the same browser, then opens the invoice list or the page that was originally requested.
- `/invoices/` is the signed-in entity's default list of unpaid and paid invoices. `/invoices/<entityId>` applies an explicit filter: your own entity shows the same list with a back arrow, and another entity shows the invoices you share with it.
- An invoice page shows the provider, the client, the project, the amount, the payments, the item lines, and the payment methods for the invoice currency. It can be opened as `/invoice/<invoiceId>`, or as `/invoices/<entityId>/invoice/<invoiceId>` to keep the filtered list as the back destination.
- A signed-in user who cannot read the requested entity or invoice receives a styled `404` page with a sign-out option.
- The pages render on the server with React. The browser receives HTML and CSS only.
- Invoice data has a small inheritance system. A child invoice can inherit fields from a parent, then override the fields that differ. The data module verifies the computed totals and the payment state.
- Email delivery uses the Mailgun HTTP API.

## Requirements

- Node.js 22 or later and npm.
- A Cloudflare account for deployment.
- A Mailgun sending key for sign-in email.

## Setup

```bash
npm install
npm run build
npm start
```

`npm start` runs the build first, then starts `wrangler dev`. The local site listens on the port that Wrangler reports, normally `8787`.

Open the site using the same host as `PUBLIC_ORIGIN`. Session cookies are host-scoped, so `localhost` and `127.0.0.1` are different sessions, and a magic link points at the configured origin.

`wrangler dev` reads `.dev.vars`. The repository stores `.dev.vars` through strongbox, so a checkout with the strongbox filter provides the values. Without the filter, copy `.dev.vars.example` to `.dev.vars` and fill the values.

## Commands

| Command | Purpose |
| --- | --- |
| `npm run build` | Compile `public/tailwind.css` into `public/tailwind.min.css` |
| `npm run typecheck` | Run the TypeScript compiler without emitting files |
| `npm start` | Build, then run the local Cloudflare Worker |
| `npm run deploy` | Build, then deploy the Worker and the `public/` assets |

## Environment

| Variable | Purpose |
| --- | --- |
| `SESSION_ENCRYPTION_KEY` | Encrypts the stateless session cookie. 32-byte base64url. Required. |
| `MAILGUN_SENDING_KEY` | Authenticates the Mailgun HTTP API. Required for sign-in email. |
| `MAILGUN_DOMAIN` | Sending domain. Defaults to the domain part of `MAILGUN_LOGIN`. |
| `MAILGUN_LOGIN` | Sender mailbox. The sender name is `Bevry Billing` unless `EMAIL_FROM` is set. |
| `EMAIL_FROM` | Full sender value, for example `Bevry Billing <mailbox@example.com>`. |
| `MAILGUN_BASE_URL` | Mailgun API base URL. Defaults to `https://api.mailgun.net`. An EU account uses `https://api.eu.mailgun.net`. |
| `PUBLIC_ORIGIN` | Origin used in generated links. Local development sets this to the dev server URL. |

The Mailgun HTTP API uses `api:<sending key>` Basic auth. The SMTP login and SMTP password are not used, because Cloudflare Workers send through HTTP.

Set the production values as Worker secrets with `wrangler secret put`, or in the Cloudflare dashboard. Do not add values to a tracked file.

## Secret handling

`.gitattributes` sends `.dev.vars` and `source/data/*` through the strongbox filter. The committed files are encrypted. The working tree holds plaintext while the filter is available.

Never copy, quote, summarise, or infer values from those files in this README, `DESIGN.md`, another public file, a commit message, an issue, or a plan. Describe the shape of the data, never its values.

## Structure

| Path | Purpose |
| --- | --- |
| `worker/` | Worker router and request handlers for login, verification, invoice lists, and invoice pages |
| `source/pages/` | Server-rendered React page components |
| `source/layouts/` | HTML shells for the invoice pages and the sign-in pages |
| `source/components/` | Invoice, entity, currency, and date components |
| `source/data/` | Invoice, entity, payment method, service, and term records (strongbox) |
| `source/lib/` | Types, session helpers, rendering helpers, and Mailgun delivery |
| `public/` | Static assets and the compiled Tailwind stylesheet |
| `wrangler.jsonc` | Worker name, entry point, assets binding, and custom domain |
| `DESIGN.md` | Evergreen design decisions and implementation details |
| `AGENTS.md` | Instructions for AI agents |
| `.dev.vars.example` | Names and defaults for the local environment |

<!-- LICENSE/ -->

## License

Unless stated otherwise all works are:

- Copyright &copy; [Benjamin Lupton](https://balupton.com)

and licensed under:

- [Reciprocal Public License 1.5](http://spdx.org/licenses/RPL-1.5.html)

<!-- /LICENSE -->
