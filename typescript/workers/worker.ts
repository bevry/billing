// DEPLOY this cloudflare worker to the route: DOMAIN/index.json
import { Database, Entities, Invoices } from '../types'

async function handler(request: FetchEvent['request']) {
	// CUTOMISE the DOMAIN value here
	if (request.url.includes('DOMAIN/index.json')) {
		const email = request.headers.get('Cf-Access-Authenticated-User-Email')
		if (!email)
			return new Response('Not authorised', {
				status: 403,
				statusText: 'Forbidden'
			})
		return fetch(request)
			.then(data => data.json())
			.then((data: Database) => {
				// entities for the currently logged in user
				const user: Entities = {}
				// entities for invoices associated with the currently logged in user
				const entities: Entities = {}
				Object.keys(data.entities).forEach(id => {
					const entity = data.entities[id]
					if (entity.contact.email === email) user[id] = entity
				})
				// store invoices associated associated with the currently logged in user
				const invoices: Invoices = {}
				Object.keys(data.invoices).forEach(id => {
					const invoice = data.invoices[id]
					if (user[invoice.provider] || user[invoice.client]) {
						// add this invoice that is associated with the currently logged in user
						invoices[id] = invoice
						// add these entities that are associated with this invoice
						entities[invoice.provider] = data.entities[invoice.provider]
						entities[invoice.client] = data.entities[invoice.client]
					}
				})
				data.entities = entities
				data.invoices = invoices
				return new Response(JSON.stringify(data), {
					status: 200,
					statusText: 'OK',
					headers: {
						'content-type': 'application/json; charset=utf-8',
						'content-encoding': 'gzip'
					}
				})
			})
			.catch(err => new Response(err, { status: 400 }))
	}

	// continue
	return fetch(request)
}

addEventListener('fetch', (_event: Event) => {
	const event = _event as FetchEvent
	event.respondWith(handler(event.request))
})
