import TailwindLayoutComponent from 'layouts/Tailwind'
export interface Props {
	url: string
}
export default function RedirectPageComponent({ url }: Props) {
	return (
		<TailwindLayoutComponent
			title="Redirecting"
			className="bg-gray-50 flex h-screen"
		>
			<div className="py-8 px-4 mx-auto max-w-screen-xl lg:py-16 lg:px-6">
				<div className="mx-auto max-w-screen-sm text-center">
					<div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900 p-2 flex items-center justify-center mx-auto mb-3.5">
						<svg
							aria-hidden="true"
							className="w-8 h-8 text-green-500 dark:text-green-400"
							fill="currentColor"
							viewBox="0 0 20 20"
							xmlns="http://www.w3.org/2000/svg"
						>
							<path
								fill-rule="evenodd"
								d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
								clip-rule="evenodd"
							></path>
						</svg>
						<span className="sr-only">Success</span>
					</div>
					<p className="mb-4 text-3xl tracking-tight font-bold text-gray-900 md:text-4xl dark:text-white">
						Redirecting
					</p>
					<p className="mb-4 text-lg font-light text-gray-500 dark:text-gray-400">
						If your browser does not redirect automatically
					</p>
					<a
						href={url}
						className="inline-flex text-white bg-primary-600 hover:bg-primary-800 focus:ring-4 focus:outline-none focus:ring-primary-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:focus:ring-primary-900 my-4"
					>
						redirect manually
					</a>
				</div>
			</div>
			<script>document.location = {url}</script>
		</TailwindLayoutComponent>
	)
}
