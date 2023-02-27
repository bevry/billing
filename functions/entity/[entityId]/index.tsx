// entity invoices
import InvoicesPageComponent from 'source/pages/Invoices'
import type { Env } from 'source/env'
import { sendError, sendReact, getSession } from 'source/util'
import { getDatabase } from 'source/data/database'

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
