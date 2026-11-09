// Cloudflare Turnstile token verification. The sign-in handler checks the
// token before it sends any email.
export interface TurnstileEnv {
	TURNSTILE_SITE_KEY?: string
	TURNSTILE_SECRET_KEY?: string
}

const SITEVERIFY_URL =
	'https://challenges.cloudflare.com/turnstile/v0/siteverify'
const EXPECTED_ACTION = 'login'
const MAX_TOKEN_LENGTH = 2048

/**
 * Return true when both Turnstile values are present.
 * @param env The environment with the Turnstile values.
 * @returns True when both values are present.
 */
export function hasTurnstileConfig(env: TurnstileEnv): boolean {
	return Boolean(env.TURNSTILE_SITE_KEY && env.TURNSTILE_SECRET_KEY)
}

/**
 * Verify a Turnstile token.
 * @param env The environment with the Turnstile secret.
 * @param token The token from the form.
 * @param expectedHostname The hostname of the browser origin.
 * @param remoteIp The visitor IP address.
 * @returns True when Siteverify accepts the token.
 */
export async function verifyTurnstile(
	env: TurnstileEnv,
	token: string,
	expectedHostname: string,
	remoteIp?: string
): Promise<boolean> {
	if (!env.TURNSTILE_SECRET_KEY) return false
	if (!token || token.length > MAX_TOKEN_LENGTH) return false
	const hostname = expectedHostname.trim().toLowerCase()
	if (!hostname) return false

	const body = new FormData()
	body.append('secret', env.TURNSTILE_SECRET_KEY)
	body.append('response', token)
	if (remoteIp && remoteIp !== 'local') body.append('remoteip', remoteIp)

	try {
		const response = await fetch(SITEVERIFY_URL, {
			method: 'POST',
			body,
			signal: AbortSignal.timeout(10_000),
		})
		if (!response.ok) return false
		const result: unknown = await response.json()
		if (
			typeof result !== 'object' ||
			result === null ||
			!('success' in result) ||
			result.success !== true ||
			!('action' in result) ||
			result.action !== EXPECTED_ACTION ||
			!('hostname' in result) ||
			typeof result.hostname !== 'string'
		) {
			return false
		}
		return result.hostname.toLowerCase() === hostname
	} catch {
		return false
	}
}
