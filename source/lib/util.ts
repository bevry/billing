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
