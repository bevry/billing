import BillingLayoutComponent from 'layouts/Billing'
import LogoutFormComponent from 'components/LogoutForm'

export interface Props {
	logoutFormToken: string
	next: string
}

export default function NotFoundPageComponent({
	logoutFormToken,
	next,
}: Props) {
	return (
		<BillingLayoutComponent
			title="Page not available"
			logoutFormToken={logoutFormToken}
			logoutNext={next}
		>
			<article className="error">
				<section>
					<h1>Page not available</h1>
					<p>
						The page you are trying to access is not found or is unavailable to
						you.
					</p>
					<div className="not-found-signout">
						<span>If you believe you should have access to it, </span>
						<LogoutFormComponent
							token={logoutFormToken}
							next={next}
							text="sign out and sign in with a different account"
							className="logout-form logout-link"
						/>
						<span>.</span>
					</div>
					<p>
						<a href="/invoices/">Go to your invoices</a>
					</p>
				</section>
			</article>
		</BillingLayoutComponent>
	)
}
