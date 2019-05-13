import * as fsUtil from 'fs'
import * as pathUtil from 'path'

import entities from '../data/entities'
import invoices from '../data/invoices'
import services from '../data/services'
import terms from '../data/terms'

const data = { entities, invoices, services, terms }
const path = pathUtil.resolve(process.cwd(), 'www', 'index.json')

// verify / compile
Object.values(invoices).forEach(invoice => {
	// determine paid
	if (invoice.payments && invoice.paid == null) {
		let total = 0
		const currency = invoice.currency
		invoice.payments.forEach(payment => {
			if (payment.currency != null && currency !== payment.currency) {
				throw new Error(
					`invoice ${invoice.id} has paid=null yet multiple currencies`
				)
			}
			total += payment.amount
		})
		invoice.paid = total === invoice.amount
	}
})

// write
fsUtil.promises
	.writeFile(path, JSON.stringify(data, null, ''))
	.then(() => console.log('wrote', path))
	.catch(console.error)
