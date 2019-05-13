import { ArithmeticUnits } from '/vendor/daet.js'

export interface Services {
	[key: string]: string
}

export interface Terms {
	[key: string]: string
}

export interface Entity {
	alias?: string[]
	name: string
	website?: string
	contact: {
		name: string
		email: string
		phone?: string
	}
	verification?: {
		[key: string]: string
	}
	address?: {
		street: string
		city: string
		state: string
		country: string
		zip: string
	}
}
export interface Entities {
	[key: string]: Entity
}

interface Project {
	name: string
	note?: string
}
export interface InvoiceBase {
	amount: number
	services: string[]
	currency: string
	provider: string
	client: string
	project: string | Project
	issued: string
	paid?: string | null | boolean
	due?: string | [number, ArithmeticUnits]

	hours?: number
	days?: string[] | number
	weeks?: string[] | number
	extras?: Array<{
		name: string
		multiplier: number
	}>
	rate?: {
		amount: number
		each: string
	}
	type?: string
	payments?: Array<{
		date: string
		amount: number
		from?: string
		currency?: string
	}>
	note?: string
	gst?: boolean
}
export interface Invoice extends InvoiceBase {
	id: string
	project: Project
}
export interface Invoices {
	[key: string]: Invoice
}

export interface Database {
	login?: string
	entities: Entities
	invoices: Invoices
	services: Services
	terms: Terms
}
