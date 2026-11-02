// Worker router: explicit paths for the app, assets for everything else.
import type { Env } from 'lib/env'
import { handleLogin } from './login'
import {
	handleAuthenticateGet,
	handleAuthenticateMethodNotAllowed,
	handleAuthenticatePost,
	handleLogoutMethodNotAllowed,
} from './authenticate'
import { handleLogout } from './logout'
import { handleEntity } from './entity'
import { handleInvoice } from './invoice'

const invoicePath = /^\/entity\/([^/]+)\/invoice\/([^/]+)\/?$/
const entityPath = /^\/entity\/([^/]+)\/?$/
const authenticatePath = /^\/authenticate\/([^/]+)\/?$/

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

		const invoiceMatch = invoicePath.exec(path)
		if (invoiceMatch) {
			return withSecurityHeaders(
				await handleInvoice(request, env, invoiceMatch[1], invoiceMatch[2])
			)
		}

		const entityMatch = entityPath.exec(path)
		if (entityMatch) {
			return withSecurityHeaders(
				await handleEntity(request, env, entityMatch[1])
			)
		}

		return env.ASSETS.fetch(request)
	},
} satisfies ExportedHandler<Env>
