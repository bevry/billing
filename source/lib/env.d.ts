import type { MailgunEnv } from 'lib/mailgun'

export interface RateLimitBinding {
	limit(options: { key: string }): Promise<{ success: boolean }>
}

export interface Env extends MailgunEnv {
	SESSION_ENCRYPTION_KEY: string
	PUBLIC_ORIGIN?: string
	ASSETS: Fetcher
	LOGIN_IP_RATE_LIMITER?: RateLimitBinding
	LOGIN_EMAIL_RATE_LIMITER?: RateLimitBinding
	VERIFY_IP_RATE_LIMITER?: RateLimitBinding
}
