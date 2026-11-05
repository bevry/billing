export interface Props {
	token: string
	next?: string
	text?: string
	className?: string
}

export default function LogoutFormComponent({
	token,
	next,
	text = 'Sign out',
	className = 'logout-form',
}: Props) {
	return (
		<form className={className} action="/logout" method="POST">
			<input type="hidden" name="logoutFormToken" value={token} />
			{next && <input type="hidden" name="next" value={next} />}
			<button type="submit">{text}</button>
		</form>
	)
}
