import TailwindLayoutComponent from 'layouts/Tailwind'

export interface Props {
	token: string
	entityName: string
}

export default function ConfirmPageComponent({ token, entityName }: Props) {
	return (
		<TailwindLayoutComponent
			title="Confirm sign in to Bevry Billing"
			className="bg-gray-50 flex h-screen"
		>
			<div className="m-auto text-center">
				<h2 className="text-center text-3xl font-bold tracking-tight text-gray-900">
					Sign in to Bevry Billing
				</h2>
				<p className="mt-2 text-center text-sm text-gray-600">
					Continue as <span className="font-medium">{entityName}</span>.
				</p>
				<form className="mt-8" action="/authenticate" method="POST">
					<input type="hidden" name="token" value={token} />
					<button
						type="submit"
						className="group relative flex w-full justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
					>
						Sign in
					</button>
				</form>
			</div>
		</TailwindLayoutComponent>
	)
}
