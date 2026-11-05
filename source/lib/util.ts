import type { Invoice } from 'lib/types'
import type { ReactElement } from 'react'
import Daet from 'daet'
import RedirectPageComponent from 'pages/Redirect'
import { renderToStaticMarkup } from 'react-dom/server'

export function isInvalidDate(datetime: string) {
	return isNaN(new Daet(datetime).getTime())
}

export function getInvoiceType(invoice: Invoice) {
	return invoice.type === 'quote' ? 'quote' : 'invoice'
}

export function getInvoiceFullType(invoice: Invoice) {
	return invoice.type === 'quote' ? 'Quote' : 'Tax Invoice'
}

export function getInvoiceShortType(invoice: Invoice) {
	return invoice.type === 'quote' ? 'Quote' : 'Invoice'
}

export function has<T>(value: T) {
	return value || null
}

function parseHttpOrigin(value: string | null): string | null {
	if (!value) return null
	try {
		const url = new URL(value)
		if (url.protocol === 'http:' || url.protocol === 'https:') {
			return url.origin
		}
	} catch {
		// not a URL
	}
	return null
}

// PUBLIC_ORIGIN pins the dev server URL. Otherwise use the browser's Origin
// or Referer, because a dev proxy may rewrite the request URL to the
// production route.
export function getRequestOrigin(
	request: Request,
	publicOrigin?: string
): string {
	const configured = parseHttpOrigin(publicOrigin ?? null)
	if (configured) return configured

	const browserOrigin =
		parseHttpOrigin(request.headers.get('origin')) ??
		parseHttpOrigin(request.headers.get('referer'))
	if (browserOrigin) return browserOrigin

	return new URL(request.url).origin
}

export function getRequestPath(request: Request): string {
	const url = new URL(request.url)
	return url.pathname + url.search
}

// Only accept a same-origin path that belongs to the invoice app. A stored
// return path is encrypted in the pending session, but the value still passes
// through a form and a query string, so it must be checked on every read.
export function getSafeNextPath(
	value: string | null | undefined,
	fallback = ''
): string {
	if (!value) return fallback

	let url: URL
	try {
		url = new URL(value, 'https://billing.invalid')
	} catch {
		return fallback
	}

	if (url.origin !== 'https://billing.invalid') return fallback
	if (!url.pathname.startsWith('/')) return fallback
	if (url.pathname.startsWith('//')) return fallback

	const allowed =
		url.pathname === '/invoices' ||
		url.pathname.startsWith('/invoices/') ||
		url.pathname === '/invoice' ||
		url.pathname.startsWith('/invoice/') ||
		url.pathname.startsWith('/entity/')
	if (!allowed) return fallback

	return url.pathname + url.search
}

export function sendRelativeRedirect(
	request: Request,
	path: string,
	publicOrigin?: string,
	status = 303
): Response {
	const url = new URL(path, getRequestOrigin(request, publicOrigin))
	return new Response(null, {
		status,
		headers: {
			Location: url.toString(),
			'Cache-Control': 'no-store',
		},
	})
}

export function sendLoginRedirect(
	request: Request,
	nextPath: string,
	publicOrigin?: string
): Response {
	const url = new URL('/login', getRequestOrigin(request, publicOrigin))
	const next = getSafeNextPath(nextPath, '')
	if (next) url.searchParams.set('next', next)
	return new Response(null, {
		status: 303,
		headers: {
			Location: url.toString(),
			'Cache-Control': 'no-store',
		},
	})
}

export function sendError(
	message: string,
	status: number = 400,
	headers: HeadersInit = {}
) {
	return new Response(message, {
		status,
		headers: {
			'Content-Type': 'text/plain;charset=UTF-8',
			...headers,
		},
	})
}

export function sendReact(
	content: ReactElement,
	headers: HeadersInit = {},
	status: number = 200
) {
	return new Response(renderToStaticMarkup(content), {
		status,
		headers: {
			'Content-Type': 'text/html;charset=UTF-8',
			...headers,
		},
	})
}

export function sendRedirect(
	url: string,
	code: number = 303,
	headers: HeadersInit = {}
) {
	return new Response(renderToStaticMarkup(RedirectPageComponent({ url })), {
		status: code,
		headers: {
			'Content-Type': 'text/html;charset=UTF-8',
			...headers,
		},
	})
}
