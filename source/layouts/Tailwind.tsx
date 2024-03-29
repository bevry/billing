import type { ReactNode } from 'react'
export interface Props {
	title: string
	className?: string
	children: ReactNode
}
export default function TailwindLayoutComponent({
	title,
	className,
	children,
}: Props) {
	return (
		<html lang="en">
			<head>
				<meta charSet="UTF-8" />
				<meta
					name="viewport"
					content="width=device-width, initial-scale=1, shrink-to-fit=no"
				/>
				<link rel="stylesheet" href="/tailwind.min.css" />
				<link
					href="https://cdnjs.cloudflare.com/ajax/libs/flowbite/1.6.3/flowbite.min.css"
					rel="stylesheet"
				/>
				<title>{title || 'Bevry Billing'}</title>
			</head>
			<body
				className={
					className || 'antialiased font-sans bg-gray-200 overflow-hidden'
				}
			>
				{children}
				<script src="https://cdnjs.cloudflare.com/ajax/libs/flowbite/1.6.3/flowbite.min.js"></script>
			</body>
		</html>
	)
}
