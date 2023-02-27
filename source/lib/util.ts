import type { Invoice } from 'lib/types'
import Daet from 'daet'

import { createWebCryptSession } from 'webcrypt-session'
import { z } from 'zod'
const sessionScheme = z.object({
	entityId: z.string(),
	verified: z.boolean(),
	token: z.string(),
	userAgent: z.string(),
})

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
	return createWebCryptSession(sessionScheme, request, {
		password,
	})
}

export function sendError(message: string, status: number = 400) {
	return new Response(message, {
		status,
		headers: {
			'Content-Type': 'text/plain;charset=UTF-8',
		},
	})
}

export function sendReact(
	content: JSX.Element | string,
	headers?: HeadersInit
) {
	return new Response(content as string, {
		status: 200,
		headers: {
			'Content-Type': 'text/html;charset=UTF-8',
			...headers,
		},
	})
}
