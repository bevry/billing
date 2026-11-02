// AES-GCM token helpers. The payload is encrypted and authenticated.
const encoder = new TextEncoder()
const decoder = new TextDecoder()
const keys = new Map<string, Promise<CryptoKey>>()

export function base64UrlEncode(bytes: Uint8Array): string {
	let binary = ''
	for (const byte of bytes) binary += String.fromCharCode(byte)
	return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export function base64UrlDecode(value: string): Uint8Array {
	const binary = atob(value.replace(/-/g, '+').replace(/_/g, '/'))
	const bytes = new Uint8Array(binary.length)
	for (let index = 0; index < binary.length; index++) {
		bytes[index] = binary.charCodeAt(index)
	}
	return bytes
}

export function randomToken(bytes = 32): string {
	return base64UrlEncode(crypto.getRandomValues(new Uint8Array(bytes)))
}

export async function hashToken(value: string): Promise<string> {
	const digest = await crypto.subtle.digest('SHA-256', encoder.encode(value))
	return base64UrlEncode(new Uint8Array(digest))
}

function getKey(secret: string): Promise<CryptoKey> {
	let key = keys.get(secret)
	if (!key) {
		const raw = base64UrlDecode(secret)
		if (raw.length !== 32) {
			throw new Error('SESSION_ENCRYPTION_KEY must be 32 bytes in base64url')
		}
		key = crypto.subtle.importKey(
			'raw',
			raw as BufferSource,
			'AES-GCM',
			false,
			['encrypt', 'decrypt']
		)
		keys.set(secret, key)
	}
	return key
}

export async function encryptJson(
	secret: string,
	value: unknown,
	context: string
): Promise<string> {
	const iv = crypto.getRandomValues(new Uint8Array(12))
	const ciphertext = await crypto.subtle.encrypt(
		{
			name: 'AES-GCM',
			iv: iv as BufferSource,
			additionalData: encoder.encode(context) as BufferSource,
			tagLength: 128,
		},
		await getKey(secret),
		encoder.encode(JSON.stringify(value)) as BufferSource
	)
	return `v1.${base64UrlEncode(iv)}.${base64UrlEncode(
		new Uint8Array(ciphertext)
	)}`
}

export async function decryptJson<T>(
	secret: string,
	token: string,
	context: string
): Promise<T | null> {
	const [version, iv, ciphertext] = token.split('.')
	if (version !== 'v1' || !iv || !ciphertext) return null
	try {
		const plaintext = await crypto.subtle.decrypt(
			{
				name: 'AES-GCM',
				iv: base64UrlDecode(iv) as BufferSource,
				additionalData: encoder.encode(context) as BufferSource,
				tagLength: 128,
			},
			await getKey(secret),
			base64UrlDecode(ciphertext) as BufferSource
		)
		return JSON.parse(decoder.decode(plaintext)) as T
	} catch {
		return null
	}
}

// The compared values are fixed-length base64url strings. The loop compares
// every byte, so a prefix mismatch does not return early.
export function constantTimeEqual(left: string, right: string): boolean {
	const a = encoder.encode(left)
	const b = encoder.encode(right)
	if (a.length !== b.length) return false
	let difference = 0
	for (let index = 0; index < a.length; index++) {
		difference |= a[index] ^ b[index]
	}
	return difference === 0
}
