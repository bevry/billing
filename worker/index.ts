// Worker router: explicit paths for the app, assets for everything else.
import type { Env } from 'lib/env'
import {
	getRequestPath,
	sendLoginRedirect,
	sendRelativeRedirect,
} from 'lib/util'
import { isSignedInSession, readSession } from 'lib/session'
import { handleLogin } from './login'
import {
	handleAuthenticateGet,
	handleAuthenticateMethodNotAllowed,
	handleAuthenticatePost,
	handleLogoutMethodNotAllowed,
} from './authenticate'
import { handleLogout } from './logout'
import { handleInvoices, handleInvoicesRoot } from './invoices'
import { handleInvoice } from './invoice'

const filteredInvoicePath = /^\/invoices\/([^/]+)\/invoice\/([^/]+)\/?$/
const invoicePath = /^\/invoice\/([^/]+)\/?$/
const invoicesPath = /^\/invoices\/([^/]+)\/?$/
const legacyInvoicePath = /^\/entity\/([^/]+)\/invoice\/([^/]+)\/?$/
const legacyEntityPath = /^\/entity\/([^/]+)\/?$/
const authenticatePath = /^\/authenticate\/([^/]+)\/?$/

// Preserve the original legacy URL through sign-in, then canonicalise once the
// browser has a valid session.
async function handleLegacyRedirect(
	request: Request,
	env: Env,
	canonicalPath: string
): Promise<Response> {
	const session = await readSession(request, env.SESSION_ENCRYPTION_KEY)
	if (!isSignedInSession(session) || session.expiresAt <= Date.now()) {
		return sendLoginRedirect(
			request,
			getRequestPath(request),
			env.PUBLIC_ORIGIN
		)
	}
	return sendRelativeRedirect(request, canonicalPath, env.PUBLIC_ORIGIN, 308)
}

function withSecurityHeaders(response: Response): Response {
	const headers = new Headers(response.headers)
	headers.set(
		'Content-Security-Policy',
		"default-src 'self'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'; img-src 'self' data:; style-src 'self'; script-src 'self'"
	)
	headers.set(
		'Strict-Transport-Security',
		'max-age=31536000; includeSubDomains'
	)
	headers.set('Referrer-Policy', 'no-referrer')
	headers.set('X-Content-Type-Options', 'nosniff')
	headers.set('X-Frame-Options', 'DENY')
	headers.set('Cache-Control', 'no-store')
	return new Response(response.body, {
		status: response.status,
		statusText: response.statusText,
		headers,
	})
}

export default {
	async fetch(
		request: Request,
		env: Env,
		ctx: ExecutionContext
	): Promise<Response> {
		const url = new URL(request.url)
		const path = url.pathname

		if (path === '/' || path === '/login') {
			return withSecurityHeaders(await handleLogin(request, env, ctx))
		}

		if (path === '/logout') {
			if (request.method !== 'POST') {
				return withSecurityHeaders(handleLogoutMethodNotAllowed())
			}
			return withSecurityHeaders(await handleLogout(request, env))
		}

		if (path === '/authenticate') {
			if (request.method !== 'POST') {
				return withSecurityHeaders(handleAuthenticateMethodNotAllowed())
			}
			return withSecurityHeaders(await handleAuthenticatePost(request, env))
		}

		const authenticateMatch = authenticatePath.exec(path)
		if (authenticateMatch) {
			if (request.method !== 'GET') {
				return withSecurityHeaders(handleAuthenticateMethodNotAllowed())
			}
			return withSecurityHeaders(
				await handleAuthenticateGet(request, env, authenticateMatch[1])
			)
		}

		const legacyInvoiceMatch = legacyInvoicePath.exec(path)
		if (legacyInvoiceMatch) {
			return withSecurityHeaders(
				await handleLegacyRedirect(
					request,
					env,
					`/invoices/${legacyInvoiceMatch[1]}/invoice/${legacyInvoiceMatch[2]}`
				)
			)
		}

		const legacyEntityMatch = legacyEntityPath.exec(path)
		if (legacyEntityMatch) {
			return withSecurityHeaders(
				await handleLegacyRedirect(
					request,
					env,
					`/invoices/${legacyEntityMatch[1]}`
				)
			)
		}

		const filteredInvoiceMatch = filteredInvoicePath.exec(path)
		if (filteredInvoiceMatch) {
			return withSecurityHeaders(
				await handleInvoice(
					request,
					env,
					filteredInvoiceMatch[2],
					filteredInvoiceMatch[1]
				)
			)
		}

		const invoiceMatch = invoicePath.exec(path)
		if (invoiceMatch) {
			return withSecurityHeaders(
				await handleInvoice(request, env, invoiceMatch[1])
			)
		}

		if (path === '/invoices') {
			return withSecurityHeaders(
				sendRelativeRedirect(request, '/invoices/', env.PUBLIC_ORIGIN, 308)
			)
		}

		if (path === '/invoices/') {
			return withSecurityHeaders(await handleInvoicesRoot(request, env))
		}

		const invoicesMatch = invoicesPath.exec(path)
		if (invoicesMatch) {
			return withSecurityHeaders(
				await handleInvoices(request, env, invoicesMatch[1])
			)
		}

		return env.ASSETS.fetch(request)
	},
} satisfies ExportedHandler<Env>
