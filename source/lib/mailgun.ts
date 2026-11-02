// Mailgun delivery through the HTTP API with Basic auth.
// https://documentation.mailgun.com/docs/mailgun/api-reference/send/mailgun
export interface MailgunEnv {
	MAILGUN_SENDING_KEY?: string
	MAILGUN_DOMAIN?: string
	MAILGUN_LOGIN?: string
	EMAIL_FROM?: string
	MAILGUN_BASE_URL?: string
}

export interface EmailMessage {
	to: string
	subject: string
	text: string
	html?: string
	replyTo?: string
}

export function getMailgunDomain(env: MailgunEnv): string {
	if (env.MAILGUN_DOMAIN) return env.MAILGUN_DOMAIN
	const login = env.MAILGUN_LOGIN
	if (!login) throw new Error('Missing MAILGUN_DOMAIN or MAILGUN_LOGIN')
	const at = login.lastIndexOf('@')
	if (at === -1) throw new Error('MAILGUN_LOGIN must contain an @')
	return login.slice(at + 1)
}

export function getMailgunFrom(env: MailgunEnv): string {
	if (env.EMAIL_FROM) return env.EMAIL_FROM
	if (env.MAILGUN_LOGIN) return `Bevry Billing <${env.MAILGUN_LOGIN}>`
	throw new Error('Missing EMAIL_FROM or MAILGUN_LOGIN')
}

// Deliver one email. Throw with the API status when delivery fails.
export async function sendEmail(
	env: MailgunEnv,
	message: EmailMessage
): Promise<void> {
	const apiKey = env.MAILGUN_SENDING_KEY
	if (!apiKey) throw new Error('Missing MAILGUN_SENDING_KEY')
	const domain = getMailgunDomain(env)
	const baseUrl = env.MAILGUN_BASE_URL || 'https://api.mailgun.net'

	const body = new FormData()
	body.append('from', getMailgunFrom(env))
	body.append('to', message.to)
	body.append('subject', message.subject)
	body.append('text', message.text)
	if (message.html) body.append('html', message.html)
	if (message.replyTo) body.append('h:Reply-To', message.replyTo)

	const response = await fetch(`${baseUrl}/v3/${domain}/messages`, {
		method: 'POST',
		headers: { authorization: `Basic ${btoa(`api:${apiKey}`)}` },
		body,
		signal: AbortSignal.timeout(15_000),
	})
	if (!response.ok) {
		throw new Error(`Mailgun ${response.status}: ${await response.text()}`)
	}
}
