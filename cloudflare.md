# cloudflare.md

Local application of the bevry-vibes skills [cloudflare.md](https://github.com/bevry-vibes/skills/blob/main/cloudflare.md) — see the upstream [local tweaks pattern](https://github.com/bevry-vibes/skills#local-tweaks-pattern).

## this project's tweaks

- The project deploys as Cloudflare Pages with Pages Functions in `functions/`. Local development uses `wrangler pages dev ./public`, and deploys use `wrangler pages publish ./public`. The upstream skill treats Cloudflare Pages as deprecated for new projects. This existing project stays on Pages until a separate Workers migration.
- The project name is `billing` in `wrangler.toml`. The static assets and the routes manifest live in `public/`. `public/_routes.json` sends every route through the Functions router except the CSS and SVG assets.
- Production secrets are `SESSION_PASSWORD` and `MAILGUN_SENDING_KEY`. Set them in the Pages project environment. The optional Mailgun variables are `MAILGUN_DOMAIN`, `MAILGUN_LOGIN`, `EMAIL_FROM`, and `MAILGUN_BASE_URL`. Names and defaults live in `.dev.vars.example`.
- `.dev.vars` and `source/data/*` use the strongbox filter. Never copy plaintext values from them into a public file.
- Email uses the Mailgun HTTP API with `api:<sending key>` Basic auth. The SMTP login and SMTP password are not used.
