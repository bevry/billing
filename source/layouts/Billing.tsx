import type { ReactNode } from 'react'
import LogoutFormComponent from 'components/LogoutForm'
import { has } from 'lib/util'
export interface Props {
	title: string
	nav?: {
		href: string
		text: string
		title: string
	}[]
	logoutFormToken?: string
	logoutNext?: string
	children: ReactNode
}
export default function BillingLayoutComponent({
	title,
	nav,
	logoutFormToken,
	logoutNext,
	children,
}: Props) {
	const showHeader = Boolean(has(nav?.length) || logoutFormToken)
	return (
		<html lang="en">
			<head>
				<meta charSet="UTF-8" />
				<meta name="viewport" content="width=device-width, initial-scale=1.0" />
				<link rel="stylesheet" href="/normalize.css" />
				<link rel="stylesheet" href="/index.css" />
				<title>{title || 'Bevry Billing'}</title>
			</head>
			<body>
				{showHeader && (
					<header className="nav">
						{has(nav?.length) && (
							<div className="nav-back">
								{nav!.map(({ href, title, text }) => (
									<a href={href} title={title} key={href}>
										{text}
									</a>
								))}
							</div>
						)}
						{logoutFormToken && (
							<LogoutFormComponent token={logoutFormToken} next={logoutNext} />
						)}
					</header>
				)}
				{children}
			</body>
		</html>
	)
}
