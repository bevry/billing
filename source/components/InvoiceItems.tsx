import type { Invoice } from 'lib/types'
import { getInvoiceShortType } from 'lib/util'
import CurrencyComponent from 'components/Currency'
export interface Props {
	invoice: Invoice
}
export default function InvoiceItemsComponent({ invoice }: Props) {
	if (!invoice.items?.length) return <></>
	const shortType = getInvoiceShortType(invoice)
	return (
		<section>
			<h2>{shortType} Items</h2>
			<table>
				<tr>
					<td colSpan={2} className="w100">
						<ol className="items">
							{invoice.items.map((invoiceItem) => (
								<li>
									<CurrencyComponent
										amount={invoiceItem.amount}
										currency={invoice.currency}
									/>
									for {invoiceItem.name}
								</li>
							))}
						</ol>
					</td>
				</tr>
			</table>
		</section>
	)
}
