import { html } from '/vendor/lit-html.js'
import { Database } from '../types'
import { goto } from '../util.js'

export default ({ invoices, entities }: Database) =>
	html`
		<div>
			<label>Invoices</label>
			<div>
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
			</div>
		</div>
	`
