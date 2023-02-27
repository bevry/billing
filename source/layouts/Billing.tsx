import type { ReactNode } from 'react'
import { has } from 'lib/util'
export interface Props {
	title: string
	nav?: {
		href: string
		text: string
		title: string
	}[]
	children: ReactNode
}
export default function BillingLayoutComponent({
	title,
	nav,
	children,
}: Props) {
	return (
		<html lang="en">
			<head>
				<meta charSet="UTF-8" />
				<meta name="viewport" content="width=device-width, initial-scale=1.0" />
				<link
					rel="stylesheet"
					href="//cdnjs.cloudflare.com/ajax/libs/normalize/8.0.1/normalize.min.css"
				/>
				<link rel="stylesheet" href="/index.css" />
				<title>{title || 'Bevry Billing'}</title>
			</head>
			<body>
				{has(nav?.length) && (
					<header className="nav">
						{nav!.map(({ href, title, text }) => (
							<a href={href} title={title}>
								{text}
							</a>
						))}
					</header>
				)}
				{children}
			</body>
		</html>
	)
}
