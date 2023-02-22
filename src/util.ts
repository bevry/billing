import Daet from 'daet'
import type { Invoice } from './types'

export function forbiddenResponse(message: string) {
	return new Response(message, {
		status: 403,
		statusText: 'Forbidden',
	})
}

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
