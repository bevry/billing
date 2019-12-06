import { html, nothing } from '/vendor/lit-html.js'
import { Database, Invoice } from '../types'
import { goto } from '../util.js'
import renderError from './error.js'
import Daet from '/vendor/daet.js'

function renderInvoices({ entities }: Database, invoices: Invoice[]) {
	return invoices.map(
		invoice => html`
			<li>
				<a href="?invoice=${invoice.id}" @click=${goto}>
					#${invoice.id}: ${entities[invoice.client].name} -
					${invoice.project.name}
				</a>
			</li>
		`
	)
}

export default (database: Database) => {
	const { invoices, entities, login } = database
	const user = Object.values(entities).find(
		user => user.contact.email === login
	)
	document.title = 'Bevry Billing'
	const sorted = Object.values(invoices).sort((b, a) =>
		new Daet(a.issued).getMillisecondsFrom(new Daet(b.issued))
	)
	const paid: Invoice[] = []
	const unpaid: Invoice[] = []
	for (const invoice of sorted) {
		if (invoice.paid) paid.push(invoice)
		else unpaid.push(invoice)
	}
	return html`
		<article class="invoices">
			<section>
				<h1>
					Welcome ${user ? user.name : 'developer'},<br />here are your invoices
				</h1>
			</section>
			${unpaid.length
				? html`
			<section>
				<h2>
					Unpaid invoices
				</h1>
				<ul>
					${renderInvoices(database, unpaid)}
				</ul>
			</section>`
				: nothing}
			${paid.length
				? html`
				<section>
					<h2>
						Paid invoices
					</h1>
					<ul>
						${renderInvoices(database, paid)}
					</ul>
				</section>`
				: nothing}
		</article>
	`
}
