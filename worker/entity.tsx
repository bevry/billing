// entity invoices
import InvoicesPageComponent from 'pages/Invoices'
import type { Env } from 'lib/env'
import { sendError, sendReact, getSession } from 'lib/util'
import { getDatabase } from 'data/database'

export async function handleEntity(
	request: Request,
	env: Env,
	entityId: string
): Promise<Response> {
	// validate
	if (!entityId) return sendError('invalid param')
	const userAgent = request.headers.get('User-Agent') || ''
	const session = await getSession(request, env.SESSION_PASSWORD)
	if (
		!session.verified ||
		session.userAgent !== userAgent ||
		session.entityId !== entityId
	) {
		console.debug(JSON.stringify({ session, userAgent, entityId }, null, '  '))
		return sendError('unauthorized', 401)
	}

	// fetch details for this entity
	const database = getDatabase({ entityId })
	const entity = database.entities[entityId]

	// confirm we have results
	if (!entity) return sendError('invalid entity')

	// render
	return sendReact(InvoicesPageComponent({ database, entityId }))
}
