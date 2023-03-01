// homepage, login, verify
import LoginPageComponent from 'pages/Login'
import type { Env } from 'lib/env'
import { sendError, sendReact, getSession } from 'lib/util'
import { getEntity } from 'data/database'

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
		session.save({
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
				'Set-Cookie': session.toHeaderValue() ?? '',
			},
		})
	} else if (url.pathname.startsWith('/authenticate/')) {
		// get token from pathname
		const token = url.pathname.substring('/authenticate/'.length)

		// validate session
		if (!token || token !== session.token) return sendError('invalid token')
		if (userAgent !== session.userAgent)
			return sendError(
				'you must use the browser that you sent the magic link with'
			)
		// assume user details are good, as we are the only ones who could have set it

		// save successful validation
		session.save({
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
				location: url.toString(),
				'Set-Cookie': session.toHeaderValue() ?? '',
			},
		})
	} else if (url.pathname === '/' || url.pathname === '/login') {
		if (context.request.method === 'POST') {
			// check form email
			debugger
			const formData = await context.request.formData()
			const email = formData.get('email') as string
			if (!email) return sendError('invalid email')

			// check an entity exists for the email
			const entity = email && getEntity(email as string)
			if (!entity) return sendError('unauthorized', 401)

			// save intent to validate
			const token = Math.random().toString(36).slice(2)
			session.save({
				entityId: entity.id,
				verified: false,
				token,
				userAgent,
			})

			// prep the verification url
			const magicLink = new URL(context.request.url)
			magicLink.pathname = `/authenticate/${token}`
			// https://mailchannels.zendesk.com/hc/en-us/articles/7122849237389
			// https://api.mailchannels.net/tx/v1/documentation
			// https://www.cloudflare.com/en-ca/learning/dns/dns-records/dns-dkim-record/
			// https://www.cloudflare.com/en-au/learning/dns/dns-records/dns-dmarc-record/
			// https://en.wikipedia.org/wiki/Sender_Policy_Framework
			// https://en.wikipedia.org/wiki/DomainKeys_Identified_Mail
			// https://dmarc.org/wiki/FAQ
			if (!context.env.MAILCHANNELS_PRIVATE_KEY)
				throw new Error('Missing DKIM Private Key for Mail Channels')
			const magicFetch = await fetch(
				'https://api.mailchannels.net/tx/v1/send',
				{
					method: 'POST',
					headers: {
						'content-type': 'application/json',
					},
					body: JSON.stringify({
						personalizations: [
							{
								to: [
									{
										email: entity.contact.email,
										name: entity.contact.name || entity.name,
									},
								],
								dkim_domain: 'bevry.me',
								dkim_selector: 'mcdkim',
								dkim_private_key: context.env.MAILCHANNELS_PRIVATE_KEY,
							},
						],
						from: {
							email: 'us@bevry.me',
							name: 'Bevry Billing',
						},
						subject: 'Magic link for Bevry Billing',
						content: [
							{
								type: 'text/plain',
								value:
									'Sign in to Bevry Billing by opening this link:\n' +
									magicLink,
							},
						],
					}),
				}
			)

			// check magic link sent
			if (!magicFetch.ok) {
				const magicResponse = await magicFetch.text()
				return sendError(
					`Magic Link: ${magicFetch.status} ${magicFetch.statusText}: ${magicResponse}`,
					magicFetch.status
				)
			}

			// render login form with email sent
			return sendReact(LoginPageComponent({ email }), {
				'Set-Cookie': session.toHeaderValue() ?? '',
			})
		}

		// render login form
		return sendReact(LoginPageComponent({}))
	} else {
		return sendError('invalid path', 404)
	}
}
