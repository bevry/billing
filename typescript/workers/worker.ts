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
				const whitelistedEntities: Entities = {}
				Object.keys(data.entities).forEach(id => {
					const entity = data.entities[id]
					if (entity.contact.email === email) whitelistedEntities[id] = entity
				})
				const whitelistedInvoices: Invoices = {}
				Object.keys(data.invoices).forEach(id => {
					const invoice = data.invoices[id]
					if (
						whitelistedEntities[invoice.provider] ||
						whitelistedEntities[invoice.client]
					) {
						whitelistedInvoices[id] = invoice
						whitelistedEntities[invoice.provider] =
							data.entities[invoice.provider]
						whitelistedEntities[invoice.client] = data.entities[invoice.client]
					}
				})
				data.entities = whitelistedEntities
				data.invoices = whitelistedInvoices
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
