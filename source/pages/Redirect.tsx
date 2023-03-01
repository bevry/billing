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
			<div className="m-auto">
				<div className="text-center">
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
					<h1 className="mt-4 text-3xl font-bold tracking-tight text-gray-900 sm:text-5xl">
						Redirecting...
					</h1>
					<p className="mt-6 text-base leading-7 text-gray-600">
						If you are not redirected automatically:
					</p>
					<p className="mt-4">
						<a href={url} className="text-sm font-semibold text-gray-900">
							Redirect Manually <span aria-hidden="true">&rarr;</span>
						</a>
					</p>
				</div>
			</div>
			{/*<script>document.location = {url}</script>*/}
		</TailwindLayoutComponent>
	)
}
