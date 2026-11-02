# AGENTS.md

This project conforms to Bevry's skills.
Reference their remote URLs only — do not pull their contents into this file.
When a referenced skill applies with your project's tweaks, the local `<name>.md` file at this repo root references the remote URL and lists the tweaks underneath;
this process is documented in the upstream repo's [local tweaks pattern](https://github.com/bevry-vibes/skills#local-tweaks-pattern).

- https://github.com/bevry-vibes/skills/blob/main/policy.md — **applies**. Agent and model reciprocity rules apply to every session.
- https://github.com/bevry-vibes/skills/blob/main/conventions.md — **applies**. Base config files are in place; the writing style, wrapping rule, splat naming, and International English rule apply to all authored content.
- https://github.com/bevry-vibes/skills/blob/main/author.md — **applies**. Authorship, trailers, and signing follow the upstream rules.
- https://github.com/bevry-vibes/skills/blob/main/commits.md — **applies**. Conventional Commits and agent-detect trailers.
- https://github.com/bevry-vibes/skills/blob/main/plans.md — **applies**. Plans live in `.plans/` with `.prompts.md` companions.
- [cloudflare.md](./cloudflare.md) — **applies**, with this project's tweaks (Cloudflare Pages Functions, strongbox secrets, Mailgun delivery).
- https://github.com/bevry-vibes/skills/blob/main/license.md — once-off initialisation is done (`LICENSE.md`, RPL-1.5, copyright Benjamin Lupton per the git configuration).

## Project purpose

Bevry Billing is the private invoice portal for Bevry. Clients and contractors sign in with a magic link and read their unpaid invoices, paid invoices, invoice details, and payment options. The records are real. The invoice and entity data compile into the application from strongbox-encrypted source files. Evergreen design decisions live in [DESIGN.md](./DESIGN.md).

## Strongbox

`.gitattributes` sends `.dev.vars` and `source/data/*` through the strongbox filter. The committed blobs are encrypted, and the working tree holds plaintext while the filter is available.

Never copy, quote, summarise, or infer values from those files in a public file, a commit message, an issue, or a plan. This rule covers the README, DESIGN, examples, and any other file that strongbox does not encrypt. Describe the shape of the data, never its values.

## Commands

Node.js 18 or later and npm are required.

```bash
npm install          # Install dependencies
npm run build        # Compile public/tailwind.min.css
npm start            # Build, then run wrangler pages dev ./public
npm run deploy       # Publish public/ and functions/ to Cloudflare Pages
```

`wrangler pages dev` reads `.dev.vars`. Copy `.dev.vars.example` to `.dev.vars` when strongbox is not available, and fill the values locally.

## Key files

| File | Purpose |
| --- | --- |
| `DESIGN.md` | Evergreen design decisions and implementation details |
| `README.md` | Project overview, commands, and public notes |
| `package.json` | Scripts and dependency versions |
| `wrangler.toml` | Cloudflare Pages project name |
| `functions/` | Pages Functions for login, verification, entity pages, and invoice pages |
| `source/pages/` | Server-rendered React page components |
| `source/layouts/` | HTML shells for the invoice pages and the sign-in pages |
| `source/components/` | Invoice, entity, currency, and date components |
| `source/data/` | Invoice, entity, payment method, service, and term records (strongbox) |
| `source/lib/` | Types, session helpers, rendering helpers, and Mailgun delivery |
| `public/` | Static assets, routes manifest, and the compiled Tailwind stylesheet |
