// entity invoice
import InvoicePageComponent from 'pages/Invoice'
import type { Env } from 'lib/env'
import { sendError, sendReact, getSession } from 'lib/util'
import { getDatabase } from 'data/database'

// import invoices from '../../data/invoices'
// export function getStaticPaths() {
// 	return Object.keys(invoices).map((id) => ({
// 		params: { invoice: id },
// 	}))
// }

export const onRequest: PagesFunction<Env> = async (context) => {
	// extract
	const entityId = context.params.entityId as string
	const invoiceId = context.params.invoiceId as string
	if (!entityId || !invoiceId) return sendError('invalid param')

	// validate
	const userAgent = context.request.headers.get('User-Agent') || ''
	const session = await getSession(
		context.request,
		context.env.SESSION_PASSWORD
	)
	if (
		!session.verified ||
		session.userAgent !== userAgent ||
		session.entityId !== entityId
	) {
		return sendError('unauthorized', 401)
	}

	// fetch details for this entity
	const database = getDatabase(entityId)
	const entity = database.entities[entityId]
	const invoice = database.invoices[invoiceId]

	// confirm we have results
	if (!entity) return sendError('invalid entity')
	if (!invoice) return sendError('invalid invoice')

	// render
	return sendReact(InvoicePageComponent({ database, entityId, invoiceId }))
}
