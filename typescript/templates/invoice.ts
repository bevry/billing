import { html, nothing } from '/vendor/lit-html.js'
import { Invoice, Database } from '../types'
import renderNav from './nav.js'
import renderEntity from './entity.js'
import Daet from '/vendor/daet.js'
import invoices from './invoices'

function renderDate(date: Daet) {
	return date.format('en', {
		year: 'numeric',
		month: 'long',
		day: 'numeric'
	})
}

function renderCurrency(amount: number, currency: string) {
	const currencyFormatter = new Intl.NumberFormat('en-US', {
		style: 'currency',
		currencyDisplay: 'code',
		currency
	})
	return currencyFormatter.format(amount)
}

export default (db: Database, invoice: Invoice) => {
	const provider = db.entities[invoice.provider]
	const client = db.entities[invoice.client]
	const services = invoice.services.map(value => db.services[value])

	const now = new Daet()

	const issued = new Daet(invoice.issued)
	const due: Daet | null =
		typeof invoice.due === 'string'
			? new Daet(invoice.due)
			: Array.isArray(invoice.due)
			? issued.plus(invoice.due[0], invoice.due[1])
			: null
	const paid: Daet | boolean =
		typeof invoice.paid === 'string'
			? new Daet(invoice.paid)
			: Boolean(invoice.paid)
	const overdue = due && due.getMillisecondsFromNow() < 0

	const type = invoice.type === 'quote' ? 'quote' : 'invoice'
	const fullType = invoice.type === 'quote' ? 'Quote' : 'Tax Invoice'
	const shortType = invoice.type === 'quote' ? 'Quote' : 'Invoice'

	document.title = `${fullType} #${invoice.id} - ${client.name} - ${invoice.project.name}`

	return html`
		${renderNav()}
		<article class="invoice">
			<section>
				<h1>
					${fullType}
					<em>#${invoice.id}: ${client.name} - ${invoice.project.name}</em>
				</h1>
			</section>

			<section>
				<h2>Service Provider (Contractor)</h2>
				${renderEntity(provider)}
			</section>

			<section>
				<h2>Service Receiver (Client)</h2>
				${renderEntity(client)}
			</section>

			<section>
				<h2>Project Details</h2>
				<table>
					<tbody>
						<tr>
							<th>Project Name</th>
							<td>${invoice.project.name}</td>
						</tr>

						<tr>
							<th>Project Services</th>
							<td>
								${services.map(
									v =>
										html`
											<div>${v}</div>
										`
								)}
							</td>
						</tr>

						${invoice.project.note
							? html`
									<tr>
										<th>Project Note</th>
										<td>${invoice.project.note}</td>
									</tr>
							  `
							: nothing}
					</tbody>
				</table>
			</section>

			<section>
				<h2>${shortType} Details</h2>
				<table>
					<tbody>
						<tr>
							<th>${shortType} Issued</th>
							<td>${renderDate(issued)}</td>
						</tr>

						${!invoice.paid && due
							? html`
									<tr>
										<th>${shortType} Due</th>
										<td>
											${renderDate(due)}
											${overdue
												? html`
														<div class="payment-overdue">
															Complete payment is overdue
														</div>
												  `
												: nothing}
										</td>
									</tr>
							  `
							: nothing}

						<tr>
							<th>${shortType} Amount</th>
							<td>
								${renderCurrency(invoice.amount, invoice.currency)}
								${invoice.gst
									? `(includes the required ${renderCurrency(
											invoice.amount * 0.1,
											invoice.currency
									  )} for the Australian Goods & Services Tax)`
									: nothing}
							</td>
						</tr>

						${type === 'invoice'
							? html`
									<tr>
										<th>Invoice Payments</th>
										<td>
											${invoice.payments && invoice.payments.length
												? invoice.payments.map(
														(v, i) => html`
															<div>
																${renderCurrency(
																	v.amount,
																	v.currency || invoice.currency
																)}
																on ${renderDate(new Daet(v.date))}
																${v.from ? ` from ${v.from}` : nothing}
															</div>
														`
												  )
												: nothing}
											${invoice.paid
												? html`
														<div class="payment-complete">
															Invoice payment complete
														</div>
												  `
												: html`
														<div class="payment-incomplete">
															Invoice awaiting
															${invoice.payments
																? 'complete payment'
																: 'initial payment'}
														</div>
												  `}
										</td>
									</tr>
							  `
							: nothing}
						${invoice.paid === false
							? html`
									<tr>
										<th>Payment Options</th>
										<td>
											<a href="https://bevry.me/payment">
												https://bevry.me/payment
											</a>
										</td>
									</tr>
							  `
							: nothing}
						${invoice.note
							? html`
									<tr>
										<th>${shortType} Note</th>
										<td>${invoice.note}</td>
									</tr>
							  `
							: nothing}
					</tbody>
				</table>
			</section>

			${invoice.items
				? html`
						<section>
							<h2>${shortType} Items</h2>
							<table>
								<tr>
									<td colspan="2" class="w100">
										<ol class="items">
											${invoice.items.map(
												item =>
													html`
														<li>
															${renderCurrency(item.amount, invoice.currency)}
															for ${item.name}
														</li>
													`
											)}
										</ol>
									</td>
								</tr>
							</table>
						</section>
				  `
				: nothing}
		</article>
	`
}

/*

	const remaining = (invoice.payments || []).reduce(
		(remaining, payment) => remaining - payment.amount,
		invoice.amount
	)
remaining
																? `payment of remaining ${currency(
																		remaining,
																		invoice.currency
																  )}`
																:

			${invoice.terms &&
				html`
					<section>
						<h2>${shortType} Terms</h2>
						<ol>
							${invoice.terms.map(
								(v, i) =>
									html`
										<li>${v}</li>
									`
							)}
						</ol>
					</section>
				`}*/
