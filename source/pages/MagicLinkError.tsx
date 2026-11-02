import TailwindLayoutComponent from 'layouts/Tailwind'

export interface Props {
	title: string
	message: string
}

export default function MagicLinkErrorPageComponent({ title, message }: Props) {
	return (
		<TailwindLayoutComponent title={title} className="bg-gray-50 flex h-screen">
			<div className="m-auto text-center">
				<h2 className="text-center text-3xl font-bold tracking-tight text-gray-900">
					{title}
				</h2>
				<p className="mt-2 text-center text-sm text-gray-600">{message}</p>
				<p className="mt-6">
					<a
						href="/login"
						className="text-sm font-semibold text-indigo-600 hover:text-indigo-500"
					>
						Request a new link
					</a>
				</p>
			</div>
		</TailwindLayoutComponent>
	)
}
