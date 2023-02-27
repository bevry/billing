import type { Database, Id } from '../types'
export interface Props {
	database: Database
	entityId: Id
	invoiceId: Id
}
export default function InvoiceListingComponent({
	database,
	entityId,
	invoiceId,
}: Props) {
	const invoice = database.invoices[invoiceId]
	const client = database.entities[invoice.client]
	return (
		<li>
			<a href={`/entity/${entityId}/invoice/${invoice.id}`}>
				#{invoice.id}: {client.name} - {invoice.project.name}
			</a>
		</li>
	)
}
