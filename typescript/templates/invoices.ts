import { html } from '/vendor/lit-html.js'
import { Database } from '../types'
import { goto } from '../util.js'
import renderError from './error.js'

export default ({ invoices, entities, login }: Database) => {
	const user = Object.values(entities).find(
		user => user.contact.email === login
	)
	document.title = 'Bevry Billing'
	return html`
		<article class="invoices">
			<section>
				<h1>
					Welcome ${user ? user.name : 'developer'},<br />here are your invoices
				</h1>
			</section>
			<ul>
				${Object.values(invoices).map(
					invoice => html`
						<li>
							<a href="?invoice=${invoice.id}" @click=${goto}>
								#${invoice.id}: ${entities[invoice.client].name} -
								${invoice.project.name}
							</a>
						</li>
					`
				)}
			</ul>
		</article>
	`
}
