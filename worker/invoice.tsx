// entity invoice
import InvoicePageComponent from 'pages/Invoice'
import type { Env } from 'lib/env'
import { sendError, sendReact, getSession } from 'lib/util'
import { getDatabase } from 'data/database'

export async function handleInvoice(
	request: Request,
	env: Env,
	entityId: string,
	invoiceId: string
): Promise<Response> {
	// validate
	if (!entityId || !invoiceId) return sendError('invalid param')
	const userAgent = request.headers.get('User-Agent') || ''
	const session = await getSession(request, env.SESSION_PASSWORD)
	if (
		!session.verified ||
		session.userAgent !== userAgent ||
		session.entityId !== entityId
	) {
		return sendError('unauthorized', 401)
	}

	// fetch details for this entity
	const database = getDatabase({ entityId, invoiceId })
	const entity = database.entities[entityId]
	const invoice = database.invoices[invoiceId]

	// confirm we have results
	if (!entity) return sendError('invalid entity')
	if (!invoice) return sendError('invalid invoice')

	// render
	return sendReact(InvoicePageComponent({ database, entityId, invoiceId }))
}
