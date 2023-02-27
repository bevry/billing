// entity invoices
import InvoicesPageComponent from 'pages/Invoices'
import type { Env } from 'lib/env'
import { sendError, sendReact, getSession } from 'lib/util'
import { getDatabase } from 'data/database'

// import entities from '../../data/entities'
// export function getStaticPaths() {
// 	return Object.keys(entities).map((id) => ({
// 		params: { entityId: id },
// 	}))
// }

export const onRequest: PagesFunction<Env> = async (context) => {
	// extract
	const entityId = context.params.entityId as string
	if (!entityId) return sendError('invalid param')

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

	// confirm we have results
	if (!entity) return sendError('invalid entity')

	// render
	return sendReact(InvoicesPageComponent({ database, entityId }))
}
