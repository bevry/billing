import InvoiceListingComponent from 'components/InvoiceListing'
import { Database, Entity } from 'lib/types'
import BillingLayoutComponent from 'layouts/Billing'
export interface Props {
	database: Database
	viewer: Entity
	filterEntity?: Entity
	logoutFormToken: string
}
export default function InvoicesPagesComponent({
	database,
	viewer,
	filterEntity,
	logoutFormToken,
}: Props) {
	const hasFilter = Boolean(filterEntity)
	const isSelfFilter = Boolean(filterEntity) && filterEntity!.id === viewer.id
	const otherFilter =
		filterEntity && filterEntity.id !== viewer.id ? filterEntity : null
	const title = otherFilter
		? `Invoices for ${viewer.name} with ${otherFilter.name}`
		: `Invoices for ${viewer.name}`

	return (
		<BillingLayoutComponent
			title={title}
			nav={
				hasFilter
					? [
							{
								href: '/invoices/',
								title: 'All invoices',
								text: '←',
							},
						]
					: []
			}
			logoutFormToken={logoutFormToken}
		>
			<article className="invoices">
				<section>
					<h1>
						Welcome {viewer.name},
						<br />
						{otherFilter
							? `here are your ${otherFilter.name} invoices`
							: isSelfFilter
								? 'here are your own invoices'
								: 'here are your invoices'}
					</h1>
				</section>
				{database.idsOfUnpaidInvoices.length > 0 && (
					<section>
						<h2>Unpaid invoices</h2>
						<ul>
							{database.idsOfUnpaidInvoices.map((invoiceId) => (
								<InvoiceListingComponent
									key={invoiceId}
									database={database}
									filterEntityId={filterEntity?.id}
									invoiceId={invoiceId}
								/>
							))}
						</ul>
					</section>
				)}
				{database.idsOfPaidInvoices.length > 0 && (
					<section>
						<h2>Paid invoices</h2>
						<ul>
							{database.idsOfPaidInvoices.map((invoiceId) => (
								<InvoiceListingComponent
									key={invoiceId}
									database={database}
									filterEntityId={filterEntity?.id}
									invoiceId={invoiceId}
								/>
							))}
						</ul>
					</section>
				)}
				{database.idsOfUnpaidInvoices.length === 0 &&
					database.idsOfPaidInvoices.length === 0 && (
						<section>
							<p>There are no invoices to show.</p>
						</section>
					)}
			</article>
		</BillingLayoutComponent>
	)
}
