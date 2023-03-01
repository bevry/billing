import type { Invoice } from 'lib/types'
import Daet from 'daet'
import RedirectPageComponent from 'pages/Redirect'
import { renderToStaticMarkup } from 'react-dom/server'
import { createWebCryptSession } from 'webcrypt-session'
import { z } from 'zod'

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

export async function getSession(request: Request, password: string) {
	if (!password) throw new Error('Session Password is required.')
	const sessionScheme = z.object({
		entityId: z.string(),
		verified: z.boolean(),
		token: z.string(),
		userAgent: z.string(),
	})
	return createWebCryptSession(sessionScheme, request, {
		password,
	})
}

export function getCookieHeaderValue(request: Request, value?: string) {
	// https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Set-Cookie
	value = throwIfEmpty(value, 'no session value')
	const url = new URL(request.url)
	return `${value}; Secure; Path=/; Domain=${url.hostname}`
}

export function throwIfEmpty<T>(value: T, error: string): NonNullable<T> {
	if (!value) throw new Error(error)
	return value
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

export function sendReact(content: JSX.Element, headers: HeadersInit = {}) {
	return new Response(renderToStaticMarkup(content), {
		status: 200,
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
// return sendRedirect(url.href, 303, {
// 	'Set-Cookie': getCookieHeaderValue(
// 		context.request,
// 		session.toHeaderValue()
// 	),
// })
