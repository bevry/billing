# cloudflare.md

Local application of the bevry-vibes skills [cloudflare.md](https://github.com/bevry-vibes/skills/blob/main/cloudflare.md) — see the upstream [local tweaks pattern](https://github.com/bevry-vibes/skills#local-tweaks-pattern).

## this project's tweaks

- The project deploys as a Cloudflare Worker with static assets. The entry point is `worker/index.ts`, the assets live in `public/`, and `wrangler.jsonc` declares the assets binding and the custom domain.
- Local development uses `wrangler dev`. Deploys use `wrangler deploy`. The Worker serves the app routes and falls through to `env.ASSETS.fetch(request)` for the static assets.
- Production secrets are `SESSION_ENCRYPTION_KEY` and `MAILGUN_SENDING_KEY`. Set them with `wrangler secret put`. The optional Mailgun variables are `MAILGUN_DOMAIN`, `MAILGUN_LOGIN`, `EMAIL_FROM`, and `MAILGUN_BASE_URL`. Names and defaults live in `.dev.vars.example`.
- `.dev.vars` and `source/data/*` use the strongbox filter. Never copy plaintext values from them into a public file.
- The Pages project still owns `billing.bevry.me` until the cutover. Release that custom domain before the first Worker deploy, or the route conflicts.
- Email uses the Mailgun HTTP API with `api:<sending key>` Basic auth. The SMTP login and SMTP password are not used.
