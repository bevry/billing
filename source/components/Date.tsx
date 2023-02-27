import type Daet from 'daet'
export interface Props {
	date: Daet
}
export default function DateComponent({ date }: Props) {
	const result = date.format('en', {
		year: 'numeric',
		month: 'long',
		day: 'numeric',
	})
	return <>{result}</>
}
