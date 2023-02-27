import BillingLayoutComponent from 'layouts/Billing'
import EntityComponent from 'components/Entity'
import DateComponent from 'components/Date'
import InvoiceItemsComponent from 'components/InvoiceItems'
import CurrencyComponent from 'components/Currency'
import Daet from 'daet'
import {
	getInvoiceFullType,
	getInvoiceShortType,
	getInvoiceType,
	has,
} from 'lib/util'

import { Database, Id } from 'lib/types'
export interface Props {
	database: Database
	entityId: Id
	invoiceId: Id
}

export default function InvoicePageComponent({
	database,
	entityId,
	invoiceId,
}: Props) {
	const entity = database.entities[entityId]
	const invoice = database.invoices[invoiceId]
	const provider = database.entities[invoice.provider]
	const client = database.entities[invoice.client]
	const services = invoice.services.map((value) => database.services[value])

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

	const type = getInvoiceType(invoice)
	const fullType = getInvoiceFullType(invoice)
	const shortType = getInvoiceShortType(invoice)

	return (
		<BillingLayoutComponent
			title={`${fullType} #${invoice.id} - ${client.name} - ${invoice.project.name}`}
			nav={[
				{
					href: `/entity/${entityId}`,
					title: `Invoices for ${entity.name}`,
					text: '←',
				},
			]}
		>
			<article className="invoice">
				<section>
					<h1>
						{fullType}
						<em>
							#{invoice.id}: {client.name} - {invoice.project.name}
						</em>
					</h1>
				</section>

				<section>
					<h2>Service Provider (Contractor)</h2>
					<EntityComponent entity={provider} />
				</section>

				<section>
					<h2>Service Receiver (Client)</h2>
					<EntityComponent entity={client} />
				</section>

				<section>
					<h2>Project Details</h2>
					<table>
						<tbody>
							<tr>
								<th>Project Name</th>
								<td>{invoice.project.name}</td>
							</tr>

							<tr>
								<th>Project Services</th>
								<td>
									{services.map((v) => (
										<div>{v}</div>
									))}
								</td>
							</tr>
							{has(invoice.project.note) && (
								<tr>
									<th>Project Note</th>
									<td>{invoice.project.note}</td>
								</tr>
							)}
						</tbody>
					</table>
				</section>

				<section>
					<h2>{shortType} Details</h2>
					<table>
						<tbody>
							<tr>
								<th>{shortType} Issued</th>
								<td>
									<DateComponent date={issued} />
								</td>
							</tr>

							{has(invoice.paid === false && due) && (
								<tr>
									<th>{shortType} Due</th>
									<td>
										<DateComponent date={due!} />
										{overdue && (
											<div className="payment-overdue">
												Complete payment is overdue
											</div>
										)}
									</td>
								</tr>
							)}

							<tr>
								<th>{shortType} Amount</th>
								<td>
									<CurrencyComponent
										amount={invoice.amount}
										currency={invoice.currency}
										gst={invoice.gst}
									/>
								</td>
							</tr>

							{has(type === 'invoice') && (
								<tr>
									<th>Invoice Payments</th>
									<td>
										{has(invoice.payments?.length) &&
											invoice.payments!.map((v, i) => (
												<div>
													<CurrencyComponent
														amount={v.amount}
														currency={v.currency || invoice.currency}
													/>
													on <DateComponent date={new Daet(v.date)} />
													{v.from && ` from ${v.from}`}
												</div>
											))}
										{invoice.paid ? (
											<div className="payment-complete">
												Invoice payment complete
											</div>
										) : (
											<div className="payment-incomplete">
												Invoice awaiting
												{invoice.payments
													? 'complete payment'
													: 'initial payment'}
											</div>
										)}
									</td>
								</tr>
							)}
							{has(invoice.paid === false) && (
								<tr>
									<th>Payment Options</th>
									<td>
										<a href="https://bevry.me/payment">
											https://bevry.me/payment
										</a>
									</td>
								</tr>
							)}
							{has(invoice.note) && (
								<tr>
									<th>{shortType} Note</th>
									<td>{invoice.note}</td>
								</tr>
							)}
						</tbody>
					</table>
				</section>
				<InvoiceItemsComponent invoice={invoice} />
			</article>
		</BillingLayoutComponent>
	)
}
