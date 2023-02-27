import { has } from 'source/util'
import type { Currency } from '../types'
export interface Props {
	amount: number
	currency: Currency
	gst?: boolean
}
export default function CurrencyComponent({ amount, currency, gst }: Props) {
	const currencyFormatter = new Intl.NumberFormat('en-US', {
		style: 'currency',
		currencyDisplay: 'code',
		currency,
	})
	const result = currencyFormatter.format(amount)
	const details =
		has(gst) &&
		`(includes the required ${(
			<CurrencyComponent amount={amount * 0.1} currency={currency} />
		)} for the Australian Goods & Services Tax)`
	return (
		<>
			{result}
			{details}
		</>
	)
}
