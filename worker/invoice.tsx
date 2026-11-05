// invoice detail
import InvoicePageComponent from 'pages/Invoice'
import type { Env } from 'lib/env'
import { getRequestPath, sendLoginRedirect, sendReact } from 'lib/util'
import { getDatabase, getEntityById } from 'data/database'
import {
	getSessionCookie,
	isSignedInSession,
	readSession,
	refreshSignedInSession,
	SESSION_IDLE_TTL_SECONDS,
} from 'lib/session'
import { handleNotFound } from './not-found'

export async function handleInvoice(
	request: Request,
	env: Env,
	invoiceId: string,
	filterEntityId?: string
): Promise<Response> {
	// validate
	if (!invoiceId) return sendLoginRedirect(request, '/invoices/')

	const session = await readSession(request, env.SESSION_ENCRYPTION_KEY)
	if (!isSignedInSession(session) || session.expiresAt <= Date.now()) {
		return sendLoginRedirect(
			request,
			getRequestPath(request),
			env.PUBLIC_ORIGIN
		)
	}

	const viewer = getEntityById(session.entityId)
	if (!viewer) return handleNotFound(request, session)

	// The database filter requires the viewer to be a party. The optional
	// filter entity must also be a party, which keeps the contextual back link
	// honest and stops one invoice from being framed as another entity's view.
	const database = getDatabase({
		viewerEntityId: session.entityId,
		invoiceId,
	})
	const invoice = database.invoices[invoiceId]
	if (!invoice) return handleNotFound(request, session)

	if (filterEntityId) {
		if (
			!getEntityById(filterEntityId) ||
			(invoice.provider !== filterEntityId && invoice.client !== filterEntityId)
		) {
			return handleNotFound(request, session)
		}
	}

	// refresh the idle timer on activity
	const refreshed = await refreshSignedInSession(
		env.SESSION_ENCRYPTION_KEY,
		session
	)

	// render
	return sendReact(
		InvoicePageComponent({
			database,
			invoiceId,
			filterEntityId,
			logoutFormToken: session.logoutFormToken,
		}),
		{
			'Set-Cookie': getSessionCookie(
				refreshed.cookieValue,
				SESSION_IDLE_TTL_SECONDS
			),
			'Cache-Control': 'no-store',
		}
	)
}
