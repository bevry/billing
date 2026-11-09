// invoice lists
import InvoicesPageComponent from 'pages/Invoices'
import type { Env } from 'lib/env'
import type { Entity } from 'lib/types'
import { getRequestPath, sendLoginRedirect, sendReact } from 'lib/util'
import { getDatabase, getEntityById } from 'data/database'
import {
	getSessionCookie,
	isSignedInSession,
	readSession,
	refreshSignedInSession,
	SESSION_IDLE_TTL_SECONDS,
	type SignedInSession,
} from 'lib/session'
import { handleNotFound } from './not-found'

async function renderInvoices(
	request: Request,
	env: Env,
	session: SignedInSession,
	options: { viewer: Entity; filterEntity: Entity | null }
): Promise<Response> {
	const { viewer, filterEntity } = options
	const database = getDatabase({
		viewerEntityId: session.entityId,
		filterEntityId: filterEntity?.id,
	})

	// An explicit filter for another entity must share at least one invoice.
	// A filter for the viewer is allowed to be empty, exactly like `/invoices/`.
	if (
		filterEntity &&
		filterEntity.id !== viewer.id &&
		Object.keys(database.invoices).length === 0
	) {
		return handleNotFound(request, session)
	}

	// refresh the idle timer on activity
	const refreshed = await refreshSignedInSession(
		env.SESSION_ENCRYPTION_KEY,
		session
	)

	const page = InvoicesPageComponent({
		database,
		viewer,
		...(filterEntity ? { filterEntity } : {}),
		logoutFormToken: session.logoutFormToken,
	})

	return sendReact(page, {
		'Set-Cookie': getSessionCookie(
			refreshed.cookieValue,
			SESSION_IDLE_TTL_SECONDS
		),
		'Cache-Control': 'no-store',
	})
}

// The default list. The viewer is the implicit filter, so there is no entity
// segment and no back arrow.
export async function handleInvoicesRoot(
	request: Request,
	env: Env
): Promise<Response> {
	const session = await readSession(request, env.SESSION_ENCRYPTION_KEY)
	if (!isSignedInSession(session) || session.expiresAt <= Date.now()) {
		return sendLoginRedirect(request, '/invoices/', env.PUBLIC_ORIGIN)
	}

	const viewer = getEntityById(session.entityId)
	if (!viewer) return handleNotFound(request, session)

	return renderInvoices(request, env, session, { viewer, filterEntity: null })
}

// An explicit filter. This includes the viewer's own entity, which is how the
// viewer reaches the same list with a back arrow and contextual invoice links.
export async function handleInvoices(
	request: Request,
	env: Env,
	requestedEntityId: string
): Promise<Response> {
	if (!requestedEntityId) {
		return sendLoginRedirect(request, '/invoices/', env.PUBLIC_ORIGIN)
	}

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

	const filterEntity = getEntityById(requestedEntityId)
	if (!filterEntity) return handleNotFound(request, session)

	return renderInvoices(request, env, session, { viewer, filterEntity })
}
