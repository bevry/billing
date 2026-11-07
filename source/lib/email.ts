// Canonical email addresses for sign-in. The helper accepts a pragmatic
// RFC 5321/5322 subset: a dot-atom local part and letter, digit, or hyphen
// domain labels. It rejects quoted local parts, address literals,
// internationalised characters, control characters, and internal whitespace.
const LOCAL_PART =
	/^[A-Za-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[A-Za-z0-9!#$%&'*+/=?^_`{|}~-]+)*$/
const DOMAIN_LABEL = /^[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?$/
const WHITESPACE = /\s/
const MAX_EMAIL_LENGTH = 254
const MAX_LOCAL_LENGTH = 64
const MAX_DOMAIN_LENGTH = 253

/**
 * Check an address for a control character or whitespace.
 */
function hasForbiddenCharacter(value: string): boolean {
	return Array.from(value).some(function (character) {
		const code = character.codePointAt(0) ?? 0
		return code === 0x7f || code <= 0x1f || WHITESPACE.test(character)
	})
}

/**
 * Return the canonical address, or null when the value is not valid.
 */
export function normaliseEmail(value: string): string | null {
	const email = value.trim()
	if (!email || email.length > MAX_EMAIL_LENGTH) return null
	if (hasForbiddenCharacter(email)) return null

	const at = email.lastIndexOf('@')
	if (at <= 0 || at === email.length - 1) return null

	const local = email.slice(0, at)
	const domain = email.slice(at + 1)
	if (local.length > MAX_LOCAL_LENGTH || !LOCAL_PART.test(local)) return null
	if (domain.length > MAX_DOMAIN_LENGTH) return null

	const labels = domain.split('.')
	if (labels.some((label) => !DOMAIN_LABEL.test(label))) return null

	return `${local}@${domain}`.toLowerCase()
}
