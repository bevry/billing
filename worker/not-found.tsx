import NotFoundPageComponent from 'pages/NotFound'
import type { SignedInSession } from 'lib/session'
import { getRequestPath, sendReact } from 'lib/util'

export function handleNotFound(
	request: Request,
	session: SignedInSession
): Response {
	return sendReact(
		NotFoundPageComponent({
			logoutFormToken: session.logoutFormToken,
			next: getRequestPath(request),
		}),
		{ 'Cache-Control': 'no-store' },
		404
	)
}
