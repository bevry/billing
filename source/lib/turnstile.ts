// Cloudflare Turnstile token verification. The sign-in handler checks the
// token before it sends any email.
export interface TurnstileEnv {
	TURNSTILE_SITE_KEY?: string
	TURNSTILE_SECRET_KEY?: string
	TURNSTILE_HOSTNAMES?: string
}

const SITEVERIFY_URL =
	'https://challenges.cloudflare.com/turnstile/v0/siteverify'
const EXPECTED_ACTION = 'login'
const MAX_TOKEN_LENGTH = 2048

/**
 * Read the approved hostnames from the environment.
 * @param env The environment with the hostname list.
 * @returns The lowercased hostname set.
 */
function getExpectedHostnames(env: TurnstileEnv): Set<string> {
	return new Set(
		(env.TURNSTILE_HOSTNAMES ?? '')
			.split(',')
			.map((hostname) => hostname.trim().toLowerCase())
			.filter(Boolean)
	)
}

/**
 * Return true when the Turnstile values and hostnames are present.
 * @param env The environment with the Turnstile values.
 * @returns True when the configuration is complete.
 */
export function hasTurnstileConfig(env: TurnstileEnv): boolean {
	return Boolean(
		env.TURNSTILE_SITE_KEY &&
		env.TURNSTILE_SECRET_KEY &&
		getExpectedHostnames(env).size
	)
}

/**
 * Verify a Turnstile token.
 * @param env The environment with the Turnstile secret.
 * @param token The token from the form.
 * @param remoteIp The visitor IP address.
 * @returns True when Siteverify accepts the token.
 */
export async function verifyTurnstile(
	env: TurnstileEnv,
	token: string,
	remoteIp?: string
): Promise<boolean> {
	if (!env.TURNSTILE_SECRET_KEY) return false
	if (!token || token.length > MAX_TOKEN_LENGTH) return false
	const expectedHostnames = getExpectedHostnames(env)
	if (expectedHostnames.size === 0) return false

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
		return expectedHostnames.has(result.hostname.toLowerCase())
	} catch {
		return false
	}
}
