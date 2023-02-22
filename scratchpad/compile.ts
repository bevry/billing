import * as fsUtil from 'fs'
import * as pathUtil from 'path'
import Daet from 'daet'
import { cwd } from 'process'

import type { Invoice } from '../src/types'

import entities from '../src/data/entities'
import invoices from '../src/data/invoices'
import services from '../src/data/services'
import terms from '../src/data/terms'

const data = { entities, invoices, services, terms }
const path = pathUtil.resolve(cwd(), 'www', 'index.json')

function invalidDate(d: string) {
	return isNaN(new Daet(d).getTime())
}

// verify / compile
Object.values(invoices).forEach((invoice) => {
	// ensure valid date
	if (invoice.issued && invalidDate(invoice.issued)) {
		throw new Error(
			`invoice ${invoice.id} issued [${invoice.issued}] is an invalid date`
		)
	}

	// determine/confirm amount
	if (invoice.rate) {
		// prepare
		const items: Invoice['items'] = []
		let total = 0
		// add weeks
		if (invoice.rate.each === 'week' && invoice.weeks) {
			if (Array.isArray(invoice.weeks)) {
				for (const week of invoice.weeks) {
					total += invoice.rate.amount
					items.push({
						amount: invoice.rate.amount,
						name: week,
					})
				}
			} else {
				const amount = invoice.rate.amount * invoice.weeks
				const name = `${invoice.weeks} weeks worked`
				items.push({
					amount,
					name,
				})
				total += amount
			}
		}
		// add days
		else if (invoice.rate.each === 'day' && invoice.days) {
			if (Array.isArray(invoice.days)) {
				for (const day of invoice.days) {
					total += invoice.rate.amount
					items.push({
						amount: invoice.rate.amount,
						name: day,
					})
				}
			} else {
				const amount = invoice.rate.amount * invoice.days
				const name = `${invoice.days} days worked`
				items.push({
					amount,
					name,
				})
				total += amount
			}
		}
		// add hours
		else if (invoice.rate.each === 'hour' && invoice.hours) {
			const amount = invoice.rate.amount * invoice.hours
			const name = `${invoice.hours} hours worked`
			items.push({
				amount,
				name,
			})
			total += amount
		}
		// error
		else {
			console.log(invoice)
			throw new Error(`invoice ${invoice.id} has invalid rate items`)
		}
		// add extras
		if (invoice.extras) {
			for (const extra of invoice.extras) {
				const amount = invoice.rate.amount * extra.multiplier
				items.push({
					amount,
					name: extra.name,
				})
				total += amount
			}
		}
		// add items
		if (invoice.items) {
			for (const item of invoice.items) {
				items.push(item)
				total += item.amount
			}
		}
		// verify
		if (invoice.amount === 0) {
			invoice.amount = total
		} else if (Math.round(invoice.amount) !== Math.round(total)) {
			throw new Error(
				`invoice ${invoice.id} calculated total ${total} is different than invoice amount ${invoice.amount}`
			)
		}
		// apply
		invoice.items = items
	}

	// convert paid into payments
	if (typeof invoice.paid === 'string') {
		if (invoice.payments) {
			throw new Error(
				`invoice ${invoice.id} has paid=string and payments=truthy, it must have one or the other`
			)
		}
		invoice.payments = [
			{
				date: invoice.paid,
				amount: invoice.amount,
			},
		]
		invoice.paid = true
	}

	// determine paid
	else if (invoice.payments && invoice.paid == null) {
		let total = 0
		const currency = invoice.currency
		invoice.payments.forEach((payment) => {
			if (payment.currency != null && currency !== payment.currency) {
				throw new Error(
					`invoice ${invoice.id} has paid=null yet multiple currencies`
				)
			}
			total += payment.amount
		})
		invoice.paid = Math.round(total) === Math.round(invoice.amount)
	}
})

// write
fsUtil.promises
	.writeFile(path, JSON.stringify(data, null, ''))
	.then(() => console.log('wrote', path))
	.catch(console.error)
