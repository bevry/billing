// Stateless session cookie. One AES-GCM encrypted cookie moves from
// `awaiting-email-link` to `signed-in`. The cookie stores a hash of the
// magic-link token, never the token itself.
import {
	constantTimeEqual,
	decryptJson,
	encryptJson,
	hashToken,
	randomToken,
} from 'lib/crypto'

export const SESSION_COOKIE_NAME = '__Host-billing-session'
export const MAGIC_LINK_TTL_MS = 60 * 60 * 1000
export const SESSION_IDLE_TTL_MS = 3 * 24 * 60 * 60 * 1000
export const MAGIC_LINK_TTL_SECONDS = MAGIC_LINK_TTL_MS / 1000
export const SESSION_IDLE_TTL_SECONDS = SESSION_IDLE_TTL_MS / 1000

const SESSION_CONTEXT = 'billing:session:v1'

export interface PendingSession {
	version: 1
	state: 'awaiting-email-link'
	entityId: string
	magicLinkTokenHash: string
	createdAt: number
	expiresAt: number
	returnTo?: string
}

export interface SignedInSession {
	version: 1
	state: 'signed-in'
	entityId: string
	signedInAt: number
	expiresAt: number
	logoutFormToken: string
}

export type SessionState = PendingSession | SignedInSession

export interface IssuedPendingSession {
	state: PendingSession
	token: string
	cookieValue: string
}

export interface IssuedSignedInSession {
	state: SignedInSession
	cookieValue: string
}

export function isPendingSession(
	session: SessionState | null
): session is PendingSession {
	return session?.state === 'awaiting-email-link'
}

export function isSignedInSession(
	session: SessionState | null
): session is SignedInSession {
	return session?.state === 'signed-in'
}

function isFiniteTimestamp(value: unknown): value is number {
	return typeof value === 'number' && Number.isFinite(value)
}

function isSessionState(value: unknown): value is SessionState {
	if (!value || typeof value !== 'object') return false
	const data = value as Record<string, unknown>
	if (data.version !== 1) return false
	if (typeof data.entityId !== 'string') return false
	if (!isFiniteTimestamp(data.expiresAt)) return false
	if (data.state === 'awaiting-email-link') {
		return (
			typeof data.magicLinkTokenHash === 'string' &&
			isFiniteTimestamp(data.createdAt) &&
			(!('returnTo' in data) || typeof data.returnTo === 'string')
		)
	}
	if (data.state === 'signed-in') {
		return (
			isFiniteTimestamp(data.signedInAt) &&
			typeof data.logoutFormToken === 'string'
		)
	}
	return false
}

function readCookie(request: Request, name: string): string | null {
	const header = request.headers.get('cookie')
	if (!header) return null
	for (const part of header.split(';')) {
		const [key, ...rest] = part.trim().split('=')
		if (key === name) return rest.join('=')
	}
	return null
}

export async function readSession(
	request: Request,
	secret: string
): Promise<SessionState | null> {
	const cookie = readCookie(request, SESSION_COOKIE_NAME)
	if (!cookie) return null
	const session = await decryptJson<SessionState>(
		secret,
		cookie,
		SESSION_CONTEXT
	)
	if (!session || !isSessionState(session)) return null
	return session
}

export async function createPendingSession(
	secret: string,
	entityId: string,
	returnTo?: string
): Promise<IssuedPendingSession> {
	const token = randomToken()
	const now = Date.now()
	const state: PendingSession = {
		version: 1,
		state: 'awaiting-email-link',
		entityId,
		magicLinkTokenHash: await hashToken(token),
		createdAt: now,
		expiresAt: now + MAGIC_LINK_TTL_MS,
		...(returnTo ? { returnTo } : {}),
	}
	return {
		state,
		token,
		cookieValue: await encryptJson(secret, state, SESSION_CONTEXT),
	}
}

export async function createSignedInSession(
	secret: string,
	entityId: string
): Promise<IssuedSignedInSession> {
	const now = Date.now()
	const state: SignedInSession = {
		version: 1,
		state: 'signed-in',
		entityId,
		signedInAt: now,
		expiresAt: now + SESSION_IDLE_TTL_MS,
		logoutFormToken: randomToken(),
	}
	return {
		state,
		cookieValue: await encryptJson(secret, state, SESSION_CONTEXT),
	}
}

export async function refreshSignedInSession(
	secret: string,
	session: SignedInSession
): Promise<IssuedSignedInSession> {
	const state: SignedInSession = {
		...session,
		expiresAt: Date.now() + SESSION_IDLE_TTL_MS,
	}
	return {
		state,
		cookieValue: await encryptJson(secret, state, SESSION_CONTEXT),
	}
}

export async function verifyPendingSession(
	session: PendingSession,
	token: string
): Promise<boolean> {
	if (session.expiresAt <= Date.now()) return false
	const tokenHash = await hashToken(token)
	return constantTimeEqual(tokenHash, session.magicLinkTokenHash)
}

export function getSessionCookie(
	cookieValue: string,
	maxAgeSeconds: number
): string {
	return `${SESSION_COOKIE_NAME}=${cookieValue}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${maxAgeSeconds}`
}

export function clearSessionCookie(): string {
	return `${SESSION_COOKIE_NAME}=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0`
}

export function isSameOriginRequest(request: Request): boolean {
	const site = request.headers.get('sec-fetch-site')
	if (site && site !== 'same-origin' && site !== 'none') return false

	const origin = request.headers.get('origin')
	if (!origin) return true

	// The browser sets Sec-Fetch-Site and a page cannot forge it. Prefer it
	// over the request URL, which a dev proxy may rewrite to the production
	// route while the browser is still on the dev URL.
	if (site === 'same-origin' || site === 'none') return true

	return origin === new URL(request.url).origin
}
