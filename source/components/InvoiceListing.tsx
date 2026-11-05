import type { Database, Id } from 'lib/types'
export interface Props {
	database: Database
	filterEntityId?: Id
	invoiceId: Id
}
export default function InvoiceListingComponent({
	database,
	filterEntityId,
	invoiceId,
}: Props) {
	const invoice = database.invoices[invoiceId]
	const client = database.entities[invoice.client]
	const href = filterEntityId
		? `/invoices/${filterEntityId}/invoice/${invoice.id}`
		: `/invoice/${invoice.id}`

	return (
		<li>
			<a href={href}>
				#{invoice.id}: {client.name} - {invoice.project.name}
			</a>
		</li>
	)
}
