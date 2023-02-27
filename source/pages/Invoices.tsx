import InvoiceListingComponent from 'components/InvoiceListing'
import { Database, Entity, Id } from 'lib/types'
import BillingLayoutComponent from 'layouts/Billing'
export interface Props {
	database: Database
	entityId: Id
}
export default function InvoicesPagesComponent({ database, entityId }: Props) {
	const entity = database.entities[entityId]
	return (
		<BillingLayoutComponent title={`Invoices for ${entity.name}`}>
			<article className="invoices">
				<section>
					<h1>
						Welcome {entity.name},<br />
						here are your invoices
					</h1>
				</section>
				{database.idsOfUnpaidInvoices.length && (
					<section>
						<h2>Unpaid invoices</h2>
						<ul>
							{database.idsOfUnpaidInvoices.map((invoiceId) => (
								<InvoiceListingComponent
									database={database}
									entityId={entityId}
									invoiceId={invoiceId}
								/>
							))}
						</ul>
					</section>
				)}
				{database.idsOfPaidInvoices.length && (
					<section>
						<h2>Unpaid invoices</h2>
						<ul>
							{database.idsOfPaidInvoices.map((invoiceId) => (
								<InvoiceListingComponent
									database={database}
									entityId={entityId}
									invoiceId={invoiceId}
								/>
							))}
						</ul>
					</section>
				)}
			</article>
		</BillingLayoutComponent>
	)
}
