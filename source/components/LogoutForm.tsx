export interface Props {
	token: string
}

export default function LogoutFormComponent({ token }: Props) {
	return (
		<form className="logout-form" action="/logout" method="POST">
			<input type="hidden" name="logoutFormToken" value={token} />
			<button type="submit">Sign out</button>
		</form>
	)
}
