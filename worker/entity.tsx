// entity invoices
import InvoicesPageComponent from 'pages/Invoices'
import type { Env } from 'lib/env'
import { sendError, sendReact } from 'lib/util'
import { getDatabase } from 'data/database'
import {
	getSessionCookie,
	isSignedInSession,
	readSession,
	refreshSignedInSession,
	SESSION_IDLE_TTL_SECONDS,
} from 'lib/session'

export async function handleEntity(
	request: Request,
	env: Env,
	entityId: string
): Promise<Response> {
	// validate
	if (!entityId) return sendError('invalid param')
	const session = await readSession(request, env.SESSION_ENCRYPTION_KEY)
	if (
		!isSignedInSession(session) ||
		session.expiresAt <= Date.now() ||
		session.entityId !== entityId
	) {
		return sendError('unauthorized', 401)
	}

	// fetch details for this entity
	const database = getDatabase({ entityId })
	const entity = database.entities[entityId]

	// confirm we have results
	if (!entity) return sendError('invalid entity')

	// refresh the idle timer on activity
	const refreshed = await refreshSignedInSession(
		env.SESSION_ENCRYPTION_KEY,
		session
	)

	// render
	return sendReact(
		InvoicesPageComponent({
			database,
			entityId,
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
