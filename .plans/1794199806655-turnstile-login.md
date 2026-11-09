# Turnstile challenge on the sign-in form

Assisted-by: OpenCode · DeepSeek V4.1 Flash <opencode-deepseek-deepseekv41flash@local>
Provenance: [prompts companion](./1794199806655-turnstile-login.prompts.md)

## Context

The sign-in form sends an email to a known address and a notice to an unknown address. A bot can submit the form repeatedly. The current per-IP and per-address rate limits reduce the effect, but they do not prove that a browser completed a challenge. The request is to add a heightened Cloudflare anti-bot check so that bots do not trigger email sends.

## Options

| Option                                             | Benefits                                                                                                                          | Costs                                                                                                                                                          |
| -------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Turnstile widget and server verification           | Cloudflare challenge. The server verifies the token before any email send. The code and the keys are under the project's control. | The sign-in page needs JavaScript. The project needs a site key and a secret key.                                                                              |
| Cloudflare WAF Managed Challenge on the login path | No application code. Cloudflare handles the challenge.                                                                            | The rule lives only in the Cloudflare dashboard. The repository cannot test or reproduce the rule. This session has no Cloudflare API credential for the rule. |
| Honeypot field and time trap                       | No third-party service. The page works without JavaScript.                                                                        | A determined bot can pass it. It does not use Cloudflare anti-bot signals.                                                                                     |

Choose Turnstile. It is the Cloudflare anti-bot control that the repository can implement, review, and test.

## Decision

- Add a Cloudflare Turnstile widget to the sign-in form.
- Verify the token with the Turnstile Siteverify API before the handler sends any email.
- Reject the request when the token is missing, invalid, expired, or already used.
- Keep the per-IP rate limit before the challenge check.
- Keep the per-address rate limit after the challenge check, so a failed challenge cannot consume the address budget.
- Keep the same check-inbox page and status for known and unknown addresses after a valid challenge.
- Do not send a magic link or a notice email when the challenge fails.
- Do not set a pending session cookie when the challenge fails.

## Configuration

The project gains two environment values:

- `TURNSTILE_SITE_KEY`: the public site key for the widget.
- `TURNSTILE_SECRET_KEY`: the server key for Siteverify.

The values are absent in the local environment and in the production Worker secrets. The implementation fails closed with a server error when a value is absent. The project cannot deploy this change until the values are set.

The expected hostname comes from the browser origin. The handler uses `PUBLIC_ORIGIN` when set, then the browser `Origin` or `Referer` header, then the request URL. No separate hostname value is needed.

Use the real widget for local development. The Cloudflare test keys do not return the action and hostname that the server checks, so they cannot pass the full verification contract.

## Request flow

`handleLogin` performs these steps for a `POST`:

1. Parse the form and normalise the email.
2. Apply the per-IP rate limit.
3. Read `cf-turnstile-response`.
4. Verify the token with Siteverify, including the `login` action and the browser hostname.
5. On failure, render the sign-in page with an error and return `403`. No email and no pending cookie.
6. On success, look up the entity.
7. Create the pending session.
8. Apply the per-address rate limit.
9. Send the magic link or the notice email.
10. Render the check-inbox page with the pending cookie.

The Siteverify request uses `secret`, `response`, and `remoteip`. The response must report success, the `login` action, and the hostname of the browser origin. The token has a maximum length of 2048 characters. The request aborts after ten seconds. A network failure counts as a failed challenge.

## Content Security Policy

The current policy allows scripts only from the same origin. Turnstile needs these origins:

- `script-src` gains `https://challenges.cloudflare.com`.
- `frame-src` gains `https://challenges.cloudflare.com`.
- `connect-src` gains `self` and `https://challenges.cloudflare.com`.

The rest of the policy stays as it is.

## Rendering

`source/pages/Login.tsx`:

- Add an optional error message.
- Separate the submitted email value from the sent state. The page must not say "Check your inbox" after a failed challenge.
- Render the Turnstile widget inside the form with the site key, the `login` action, the light theme, and the normal size.
- Load the Turnstile script from `https://challenges.cloudflare.com/turnstile/v0/api.js`.

The Turnstile widget renders inside an iframe. The page still uses server rendering, but the sign-in form needs JavaScript for the challenge.

## File impact

| File                      | Change                                                                                      |
| ------------------------- | ------------------------------------------------------------------------------------------- |
| `source/lib/turnstile.ts` | New module. Check the configuration and verify a token.                                     |
| `source/lib/env.d.ts`     | Add the Turnstile environment values.                                                       |
| `worker/login.tsx`        | Check the configuration, verify the token, and block email sends on failure.                |
| `worker/index.ts`         | Add the Turnstile origins to the Content Security Policy.                                   |
| `source/pages/Login.tsx`  | Add the widget, the error message, and the sent state.                                      |
| `.dev.vars.example`       | Name the two Turnstile values.                                                              |
| `README.md`               | Document the configuration, the challenge, and the JavaScript requirement.                  |
| `DESIGN.md`               | Update the requirements, sign-in flow, stack, email delivery, deployment, and known limits. |
| `.plans/...`              | This plan and the prompts companion.                                                        |

## Deployment gate

The implementation must not deploy until the production Worker has `TURNSTILE_SITE_KEY` and `TURNSTILE_SECRET_KEY`. A deploy without them would make the sign-in page return a server error.

## Verification

1. Run `npm run typecheck`.
2. Run `npm run build`.
3. Run `wrangler deploy --dry-run`.
4. Mock Siteverify success. Confirm a known address still receives a magic link and an unknown address still receives the notice.
5. Mock Siteverify failure. Confirm the response is `403`, no email send occurs, and no pending cookie is set.
6. Submit without a token. Confirm the request is rejected before any email send.
7. Confirm the error page does not say "Check your inbox".
8. Confirm the Content Security Policy names the Turnstile origins.
9. Use the real widget in local development. Confirm the widget renders and the form submits.
10. After the production keys are set, request a sign-in and confirm the challenge appears and the email arrives.

## Risks and limits

- The sign-in page requires JavaScript. A visitor without JavaScript cannot sign in.
- Turnstile is a third-party dependency. A Cloudflare outage or a Siteverify failure blocks sign-in. The handler fails closed.
- The token is single-use and expires after 300 seconds. A slow submit needs a new challenge.
- The keys are not present. The change cannot deploy until the operator creates a Turnstile widget and sets both values.
- The hostname check uses the browser origin. A hostname mismatch rejects the sign-in.
