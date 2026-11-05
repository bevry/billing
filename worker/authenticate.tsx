// magic-link confirmation and session creation
import ConfirmPageComponent from 'pages/Confirm'
import MagicLinkErrorPageComponent from 'pages/MagicLinkError'
import type { Env } from 'lib/env'
import {
	getRequestOrigin,
	getSafeNextPath,
	sendReact,
	sendRelativeRedirect,
} from 'lib/util'
import { getEntityById } from 'data/database'
import { clientIp, isRateLimited } from 'lib/rate-limit'
import {
	clearSessionCookie,
	createSignedInSession,
	getSessionCookie,
	isPendingSession,
	isSameOriginRequest,
	isSignedInSession,
	readSession,
	SESSION_IDLE_TTL_SECONDS,
	verifyPendingSession,
} from 'lib/session'

const noStoreHeaders = {
	'Cache-Control': 'no-store',
	'Referrer-Policy': 'no-referrer',
}

function renderError(
	title: string,
	message: string,
	status = 400,
	next = ''
): Response {
	return sendReact(
		MagicLinkErrorPageComponent({ title, message, next }),
		noStoreHeaders,
		status
	)
}

function renderBrowserMismatch(next = ''): Response {
	return renderError(
		'Open this link in the browser where you requested it',
		'This sign-in link is tied to the browser that requested it. Open the link in that browser, or request a new link in this browser.',
		400,
		next
	)
}

function renderInvalid(next = ''): Response {
	return renderError(
		'This sign-in link is invalid or has already been used',
		'Request a new link to continue.',
		400,
		next
	)
}

function renderExpired(next = ''): Response {
	return renderError(
		'This sign-in link has expired',
		'Request a new link to continue.',
		400,
		next
	)
}

export async function handleAuthenticateGet(
	request: Request,
	env: Env,
	token: string
): Promise<Response> {
	const url = new URL(request.url)
	const queryNext = getSafeNextPath(url.searchParams.get('next'), '')

	if (
		await isRateLimited(
			env.VERIFY_IP_RATE_LIMITER,
			`verify-ip:${clientIp(request)}`
		)
	) {
		return renderError(
			'Too many sign-in attempts',
			'Please wait a moment, then request a new link.',
			429,
			queryNext
		)
	}
	const session = await readSession(request, env.SESSION_ENCRYPTION_KEY)
	if (!session) return renderBrowserMismatch(queryNext)

	// A magic link opened while already signed in is not an error. The link
	// cannot be consumed because the browser no longer holds the pending
	// session, but the existing session is enough to continue.
	if (isSignedInSession(session)) {
		if (session.expiresAt > Date.now()) {
			return sendRelativeRedirect(
				request,
				queryNext || '/invoices/',
				env.PUBLIC_ORIGIN
			)
		}
		return renderExpired(queryNext)
	}

	if (!isPendingSession(session)) return renderInvalid(queryNext)

	const next = getSafeNextPath(session.returnTo, queryNext)
	if (session.expiresAt <= Date.now()) return renderExpired(next)
	if (!(await verifyPendingSession(session, token))) return renderInvalid(next)

	const entity = getEntityById(session.entityId)
	if (!entity) return renderInvalid(next)

	return sendReact(
		ConfirmPageComponent({ token, entityName: entity.name }),
		noStoreHeaders
	)
}

export async function handleAuthenticatePost(
	request: Request,
	env: Env
): Promise<Response> {
	if (!isSameOriginRequest(request)) {
		return renderError(
			'This sign-in request could not be verified',
			'Request a new link and try again.',
			403
		)
	}
	if (
		await isRateLimited(
			env.VERIFY_IP_RATE_LIMITER,
			`verify-ip:${clientIp(request)}`
		)
	) {
		return renderError(
			'Too many sign-in attempts',
			'Please wait a moment, then request a new link.',
			429
		)
	}

	const formData = await request.formData()
	const token = String(formData.get('token') || '')
	if (!token) return renderInvalid()

	const session = await readSession(request, env.SESSION_ENCRYPTION_KEY)
	if (!session) return renderBrowserMismatch()

	if (isSignedInSession(session)) {
		if (session.expiresAt > Date.now()) {
			return sendRelativeRedirect(request, '/invoices/', env.PUBLIC_ORIGIN)
		}
		return renderExpired()
	}

	if (!isPendingSession(session)) return renderInvalid()

	const next = getSafeNextPath(session.returnTo, '')
	if (session.expiresAt <= Date.now()) return renderExpired(next)
	if (!(await verifyPendingSession(session, token))) return renderInvalid(next)

	const entity = getEntityById(session.entityId)
	if (!entity) return renderInvalid(next)

	const signedIn = await createSignedInSession(
		env.SESSION_ENCRYPTION_KEY,
		entity.id
	)
	const url = new URL(
		next || '/invoices/',
		getRequestOrigin(request, env.PUBLIC_ORIGIN)
	)
	return new Response(null, {
		status: 303,
		headers: {
			Location: url.toString(),
			'Set-Cookie': getSessionCookie(
				signedIn.cookieValue,
				SESSION_IDLE_TTL_SECONDS
			),
			...noStoreHeaders,
		},
	})
}

export function handleAuthenticateMethodNotAllowed(): Response {
	return new Response(null, {
		status: 405,
		headers: {
			Allow: 'GET, POST',
			...noStoreHeaders,
		},
	})
}

export function handleLogoutMethodNotAllowed(): Response {
	return new Response(null, {
		status: 405,
		headers: {
			Allow: 'POST',
			...noStoreHeaders,
		},
	})
}

export function clearSessionResponse(
	request: Request,
	publicOrigin?: string,
	next?: string
): Response {
	const url = new URL('/login', getRequestOrigin(request, publicOrigin))
	const safeNext = getSafeNextPath(next, '')
	if (safeNext) url.searchParams.set('next', safeNext)
	return new Response(null, {
		status: 303,
		headers: {
			Location: url.toString(),
			'Set-Cookie': clearSessionCookie(),
			...noStoreHeaders,
		},
	})
}
