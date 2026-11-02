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
