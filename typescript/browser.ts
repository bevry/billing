import { Database } from './types'
import { render } from '/vendor/lit-html.js'
import renderInvoices from './templates/invoices.js'
import renderInvoice from './templates/invoice.js'

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
		const invoice = params.get('invoice')
		if (invoice) {
			render(renderInvoice(data, data.invoices[invoice]), document.body)
		} else {
			render(renderInvoices(data), document.body)
		}
	})
}

route()
window.addEventListener('popstate', route)
