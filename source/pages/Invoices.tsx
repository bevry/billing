import InvoiceListingComponent from 'components/InvoiceListing'
import LogoutFormComponent from 'components/LogoutForm'
import { Database, Entity, Id } from 'lib/types'
import BillingLayoutComponent from 'layouts/Billing'
export interface Props {
	database: Database
	entityId: Id
	logoutFormToken: string
}
export default function InvoicesPagesComponent({
	database,
	entityId,
	logoutFormToken,
}: Props) {
	const entity = database.entities[entityId]
	return (
		<BillingLayoutComponent title={`Invoices for ${entity.name}`}>
			<article className="invoices">
				<section>
					<LogoutFormComponent token={logoutFormToken} />
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
						<h2>Paid invoices</h2>
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
