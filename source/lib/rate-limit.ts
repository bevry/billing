import type { RateLimitBinding } from 'lib/env'

export function clientIp(request: Request): string {
	const forwarded = request.headers.get('x-forwarded-for')
	return (
		request.headers.get('cf-connecting-ip') ||
		forwarded?.split(',')[0]?.trim() ||
		'local'
	)
}

export async function isRateLimited(
	binding: RateLimitBinding | undefined,
	key: string
): Promise<boolean> {
	if (!binding) return false
	const { success } = await binding.limit({ key })
	return !success
}
