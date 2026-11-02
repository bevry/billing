import type { MailgunEnv } from 'lib/mailgun'

export interface Env extends MailgunEnv {
	SESSION_PASSWORD: string
	ASSETS: Fetcher
}
