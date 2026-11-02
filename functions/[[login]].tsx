// homepage, login, verify
import LoginPageComponent from 'pages/Login'
import type { Env } from 'lib/env'
import {
	sendError,
	sendReact,
	getSession,
	getCookieHeaderValue,
} from 'lib/util'
import { getEntity } from 'data/database'
import { sendEmail } from 'lib/mailgun'

export const onRequest: PagesFunction<Env> = async (context) => {
	// cookie
	const userAgent = context.request.headers.get('User-Agent') || ''
	const session = await getSession(
		context.request,
		context.env.SESSION_PASSWORD
	)

	// route
	const url = new URL(context.request.url)
	if (url.pathname === '/logout') {
		// wipe session
		await session.save({
			entityId: '',
			verified: false,
			token: '',
			userAgent,
		})

		// save session and redirect to login
		url.pathname = '/'
		return new Response(null, {
			status: 303,
			headers: {
				location: url.toString(),
				'Set-Cookie': getCookieHeaderValue(
					context.request,
					session.toHeaderValue()
				),
			},
		})
	} else if (url.pathname.startsWith('/authenticate/')) {
		// get token from pathname
		const token = url.pathname.substring('/authenticate/'.length)

		// validate session
		if (userAgent !== session.userAgent)
			return sendError(
				'you must use the browser that you sent the magic link with'
			)
		if (!token || token !== session.token) return sendError('invalid token')
		// assume user details are good, as we are the only ones who could have set it

		// save successful validation
		await session.save({
			entityId: session.entityId,
			verified: true,
			token: session.token,
			userAgent,
		})

		// save session and redirect to login
		url.pathname = `/entity/${session.entityId}`
		return new Response(null, {
			status: 303,
			headers: {
				'Set-Cookie': getCookieHeaderValue(
					context.request,
					session.toHeaderValue()
				),
				location: url.toString(),
			},
		})
	} else if (url.pathname === '/' || url.pathname === '/login') {
		// save new token
		const token = session.token || Math.random().toString(36).slice(2)
		await session.save({
			entityId: '',
			verified: false,
			token,
			userAgent,
		})
		if (context.request.method === 'POST') {
			// check we have a token from earlier
			if (!token) return sendError('invalid token')

			// check form email
			const formData = await context.request.formData()
			const email = formData.get('email') as string
			if (!email) return sendError('invalid email')

			// check an entity exists for the email
			const entity = email && getEntity(email as string)
			if (!entity) return sendError('unauthorized', 401)

			// save intent to validate
			await session.save({
				entityId: entity.id,
				verified: false,
				token,
				userAgent,
			})

			// prep the verification url
			const magicLink = new URL(context.request.url)
			magicLink.pathname = `/authenticate/${token}`

			// send the magic link through Mailgun
			try {
				const name = entity.contact.name || entity.name
				await sendEmail(context.env, {
					to: name ? `${name} <${entity.contact.email}>` : entity.contact.email,
					subject: 'Magic link for Bevry Billing',
					text: 'Sign in to Bevry Billing by opening this link:\n' + magicLink,
				})
			} catch (error) {
				const message = error instanceof Error ? error.message : String(error)
				console.debug(magicLink.href)
				return sendError(`Magic Link: ${message}`, 502, {
					'Set-Cookie': getCookieHeaderValue(
						context.request,
						session.toHeaderValue()
					),
				})
			}

			// render login form with email sent
			return sendReact(LoginPageComponent({ email }), {
				'Set-Cookie': getCookieHeaderValue(
					context.request,
					session.toHeaderValue()
				),
			})
		}

		// render login form
		return sendReact(LoginPageComponent({}), {
			'Set-Cookie': getCookieHeaderValue(
				context.request,
				session.toHeaderValue()
			),
		})
	} else {
		return sendError('invalid path', 404)
	}
}
