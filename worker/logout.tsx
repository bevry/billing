// sign out
import type { Env } from 'lib/env'
import { sendError } from 'lib/util'
import { constantTimeEqual } from 'lib/crypto'
import {
	isSameOriginRequest,
	isSignedInSession,
	readSession,
} from 'lib/session'
import { clearSessionResponse } from './authenticate'

export async function handleLogout(
	request: Request,
	env: Env
): Promise<Response> {
	if (!isSameOriginRequest(request)) {
		return sendError('invalid request origin', 403)
	}

	const session = await readSession(request, env.SESSION_ENCRYPTION_KEY)
	if (!isSignedInSession(session)) {
		return clearSessionResponse(request, env.PUBLIC_ORIGIN)
	}

	const formData = await request.formData()
	const formToken = String(formData.get('logoutFormToken') || '')
	if (!constantTimeEqual(formToken, session.logoutFormToken)) {
		return sendError('invalid form token', 400)
	}

	return clearSessionResponse(request, env.PUBLIC_ORIGIN)
}
