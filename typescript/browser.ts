import { Database } from './types'
import { render } from '/vendor/lit-html.js'
import renderInvoices from './templates/invoices.js'
import renderInvoice from './templates/invoice.js'
import renderError from './templates/error.js'

const database: Promise<Database> = fetch('/index.json').then(res => res.json())
const state = {
	location: ''
}

function route() {
	database.then(data => {
		if (state.location === document.location.href) return
		state.location = document.location.href
		const url = new URL(document.location.href)
		const params = url.searchParams
		const invoiceID = params.get('invoice')
		if (invoiceID) {
			const invoice = data.invoices[invoiceID]
			if (invoice) {
				render(renderInvoice(data, invoice), document.body)
			} else {
				render(
					renderError({
						title: 'Could not find that invoice',
						description: `Invoice #${invoiceID} does not exist for you.`
					}),
					document.body
				)
			}
		} else {
			render(renderInvoices(data), document.body)
		}
	})
}

route()
window.addEventListener('popstate', route)
