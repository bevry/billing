// Worker router: explicit paths for the app, assets for everything else.
import type { Env } from 'lib/env'
import { handleLogin } from './login'
import { handleEntity } from './entity'
import { handleInvoice } from './invoice'

const invoicePath = /^\/entity\/([^/]+)\/invoice\/([^/]+)\/?$/
const entityPath = /^\/entity\/([^/]+)\/?$/

export default {
	async fetch(request: Request, env: Env): Promise<Response> {
		const url = new URL(request.url)
		const path = url.pathname

		if (
			path === '/' ||
			path === '/login' ||
			path === '/logout' ||
			path.startsWith('/authenticate/')
		) {
			return handleLogin(request, env)
		}

		const invoiceMatch = invoicePath.exec(path)
		if (invoiceMatch) {
			return handleInvoice(request, env, invoiceMatch[1], invoiceMatch[2])
		}

		const entityMatch = entityPath.exec(path)
		if (entityMatch) {
			return handleEntity(request, env, entityMatch[1])
		}

		return env.ASSETS.fetch(request)
	},
} satisfies ExportedHandler<Env>
