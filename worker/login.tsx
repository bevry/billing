// homepage, login
import LoginPageComponent from 'pages/Login'
import type { Env } from 'lib/env'
import {
	getRequestOrigin,
	getSafeNextPath,
	sendError,
	sendReact,
	sendRelativeRedirect,
} from 'lib/util'
import { getEntity } from 'data/database'
import { normaliseEmail } from 'lib/email'
import { sendEmail } from 'lib/mailgun'
import { hashToken } from 'lib/crypto'
import { clientIp, isRateLimited } from 'lib/rate-limit'
import {
	createPendingSession,
	getSessionCookie,
	isSignedInSession,
	MAGIC_LINK_TTL_SECONDS,
	readSession,
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

	const queryNext = getSafeNextPath(url.searchParams.get('next'), '')
	const session = await readSession(request, env.SESSION_ENCRYPTION_KEY)
	if (isSignedInSession(session) && session.expiresAt > Date.now()) {
		return sendRelativeRedirect(
			request,
			queryNext || '/invoices/',
			env.PUBLIC_ORIGIN
		)
	}

	if (request.method !== 'POST') {
		return sendReact(LoginPageComponent({ next: queryNext }), {
			'Cache-Control': 'no-store',
		})
	}

	const formData = await request.formData()
	const next = getSafeNextPath(String(formData.get('next') || ''), queryNext)
	const email = normaliseEmail(String(formData.get('email') || ''))
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
		entity?.id ?? '',
		next
	)
	const emailLimited = await isRateLimited(
		env.LOGIN_EMAIL_RATE_LIMITER,
		`login-email:${await hashToken(email)}`
	)

	if (!emailLimited) {
		let delivery: Promise<void>
		if (entity) {
			const magicLink = new URL(
				`/authenticate/${pending.token}`,
				getRequestOrigin(request, env.PUBLIC_ORIGIN)
			)
			if (next) magicLink.searchParams.set('next', next)
			const name = entity.contact.name || entity.name
			delivery = sendEmail(env, {
				to: name ? `${name} <${email}>` : email,
				subject: 'Magic link for Bevry Billing',
				text:
					'Sign in to Bevry Billing by opening this link:\n' +
					magicLink.toString(),
			})
		} else {
			delivery = sendEmail(env, {
				to: email,
				subject: 'Your login to billing.bevry.me',
				text:
					`Your email ${email} was recently used to try to login to:\n` +
					'https://billing.bevry.me\n\n' +
					'However, your email is not attached to any invoices in our system!\n\n' +
					'Perhaps your invoices are attached to a different email, in which case, inform us via our existing communication channel as to your new email, such that we can update our system to attach your invoices to your new email.\n\n' +
					'Do not reply to this email.',
			})
		}
		ctx.waitUntil(
			delivery.catch(() => {
				// Never log the link or the recipient. The user can request a new email.
				console.error(JSON.stringify({ event: 'auth.email.failed' }))
			})
		)
	}

	return sendReact(LoginPageComponent({ email, next }), {
		'Set-Cookie': getSessionCookie(pending.cookieValue, MAGIC_LINK_TTL_SECONDS),
		'Cache-Control': 'no-store',
	})
}
