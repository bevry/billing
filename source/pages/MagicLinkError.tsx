import TailwindLayoutComponent from 'layouts/Tailwind'

export interface Props {
	title: string
	message: string
}

export default function MagicLinkErrorPageComponent({ title, message }: Props) {
	return (
		<TailwindLayoutComponent
			title={title}
			className="bg-gray-50 flex min-h-screen p-6"
		>
			<div className="m-auto w-full max-w-md rounded-lg bg-white p-8 text-center shadow">
				<div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 24 24"
						strokeWidth="1.5"
						stroke="currentColor"
						className="h-6 w-6 text-red-600"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							d="M12 9v3.75m0 3.75h.008v.008H12v-.008zm9.303-2.423a9 9 0 11-17.606 0 9 9 0 0117.606 0z"
						></path>
					</svg>
				</div>
				<h2 className="mt-4 text-2xl font-bold tracking-tight text-gray-900">
					{title}
				</h2>
				<p className="mt-2 text-sm text-gray-600">{message}</p>
				<a
					href="/login"
					className="mt-6 inline-flex w-full justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
				>
					Request a new link
				</a>
			</div>
		</TailwindLayoutComponent>
	)
}
