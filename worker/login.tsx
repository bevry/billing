// homepage, login
import LoginPageComponent from 'pages/Login'
import type { Env } from 'lib/env'
import { sendError, sendReact } from 'lib/util'
import { getEntity } from 'data/database'
import { sendEmail } from 'lib/mailgun'
import { hashToken } from 'lib/crypto'
import { clientIp, isRateLimited } from 'lib/rate-limit'
import {
	createPendingSession,
	getSessionCookie,
	MAGIC_LINK_TTL_SECONDS,
} from 'lib/session'

export async function handleLogin(
	request: Request,
	env: Env,
	ctx: ExecutionContext
): Promise<Response> {
	const url = new URL(request.url)
	if (url.pathname !== '/' && url.pathname !== '/login') {
		return sendError('invalid path', 404)
	}

	if (request.method !== 'POST') {
		return sendReact(LoginPageComponent({}), {
			'Cache-Control': 'no-store',
		})
	}

	const formData = await request.formData()
	const email = String(formData.get('email') || '')
		.trim()
		.toLowerCase()
	if (!email) return sendError('invalid email')

	if (
		await isRateLimited(
			env.LOGIN_IP_RATE_LIMITER,
			`login-ip:${clientIp(request)}`
		)
	) {
		return sendError('too many requests', 429)
	}

	const entity = getEntity(email)
	const pending = await createPendingSession(
		env.SESSION_ENCRYPTION_KEY,
		entity?.id ?? ''
	)
	const emailLimited = await isRateLimited(
		env.LOGIN_EMAIL_RATE_LIMITER,
		`login-email:${await hashToken(email)}`
	)

	if (entity && !emailLimited) {
		const magicLink = new URL(request.url)
		magicLink.pathname = `/authenticate/${pending.token}`
		const name = entity.contact.name || entity.name
		ctx.waitUntil(
			sendEmail(env, {
				to: name ? `${name} <${entity.contact.email}>` : entity.contact.email,
				subject: 'Magic link for Bevry Billing',
				text: 'Sign in to Bevry Billing by opening this link:\n' + magicLink,
			}).catch(() => {
				// Never log the link or the recipient. The user can request a new link.
				console.error(JSON.stringify({ event: 'auth.link.failed' }))
			})
		)
	}

	return sendReact(LoginPageComponent({ email }), {
		'Set-Cookie': getSessionCookie(pending.cookieValue, MAGIC_LINK_TTL_SECONDS),
		'Cache-Control': 'no-store',
	})
}
