import TailwindLayoutComponent from 'layouts/Tailwind'
export interface Props {
	email?: string
	sentTo?: string
	error?: string
	turnstileSiteKey: string
	next?: string
}
export default function LoginPageComponent({
	email,
	sentTo,
	error,
	turnstileSiteKey,
	next,
}: Props) {
	return (
		<TailwindLayoutComponent
			title="Sign in to Bevry Billing"
			className="bg-gray-50 flex h-screen"
		>
			<div className="m-auto">
				<div>
					{/*<img class="mx-auto h-48 w-auto" src="/banner.svg" alt="Bevry" />*/}
					<h2 className="text-center text-3xl font-bold tracking-tight text-gray-900">
						{sentTo ? 'Check your inbox' : 'Sign in to your account'}
					</h2>
					{sentTo ? (
						<p className="mt-2 text-sm font-medium	 text-green-600 dark:text-green-500 animate-pulse">
							An email has been <span className="font-medium">sent</span> to{' '}
							<span className="font-mono">{sentTo}</span>
						</p>
					) : (
						<p className="mt-2 text-center text-sm text-gray-600">
							An email will be sent to the email address.
						</p>
					)}
					{error && (
						<p className="mt-2 text-center text-sm text-red-600" role="alert">
							{error}
						</p>
					)}
				</div>
				<form className="mt-8 space-y-6" action="/login" method="POST">
					<input type="hidden" name="remember" value="true" />
					{next && <input type="hidden" name="next" value={next} />}
					<div className="-space-y-px rounded-md shadow-sm">
						<div>
							<label htmlFor="email-address" className="sr-only">
								Email address
							</label>
							<input
								id="email-address"
								name="email"
								type="email"
								autoComplete="email"
								defaultValue={email ?? sentTo}
								required
								className="relative block w-full appearance-none rounded-none rounded-t-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:z-10 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
								placeholder="Email address"
							/>
						</div>
					</div>

					<div className="flex justify-center">
						<div
							className="cf-turnstile"
							data-sitekey={turnstileSiteKey}
							data-action="login"
							data-theme="light"
							data-size="normal"
						></div>
					</div>

					<div>
						<button
							type="submit"
							className="group relative flex w-full justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
						>
							<span className="absolute inset-y-0 left-0 flex items-center pl-3">
								<svg
									xmlns="http://www.w3.org/2000/svg"
									fill="none"
									viewBox="0 0 24 24"
									strokeWidth="1.5"
									stroke="currentColor"
									className="w-6 h-6"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5"
									></path>
								</svg>
							</span>
							{sentTo ? 'Send another email' : 'Send email'}
						</button>
					</div>
				</form>
				<script
					src="https://challenges.cloudflare.com/turnstile/v0/api.js"
					async
					defer
				></script>
			</div>
		</TailwindLayoutComponent>
	)
}
