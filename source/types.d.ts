import type { ArithmeticUnits } from 'daet'
import type { StrictUnion } from 'simplytyped'

export type Id = string

// simple tables
export interface Services {
	[id: Id]: string
}
export interface Terms {
	[id: Id]: string
}

// nested tables
export interface Method {
	[field: string]: string
	currency: string
	location: string
}
export type Methods = Array<Method>

export interface EntityRaw {
	alias?: string[]
	name: string
	website?: string
	contact: {
		name: string
		email: string
		phone?: string
	}
	verification?: {
		[field: string]: string
	}
	address?: {
		street: string
		city: string
		state: string
		country: string
		zip: string
	}
}
export interface Entity extends EntityRaw {
	id: Id
}
export interface EntitiesRaw {
	[id: Id]: EntityRaw
}
export interface Entities {
	[id: Id]: Entity
}

interface Project {
	name: string
	note?: string
}
export interface InvoiceItem {
	name: string
	amount: number
}
export type Currency = string
export interface InvoiceBase {
	amount: number
	terms?: Array<Id>
	services: Array<Id>
	currency: Currency
	provider: Id
	client: Id
	project: Id | Project
	issued: string
	paid?: string | null | boolean
	due?: string | [number, ArithmeticUnits]

	hours?: number
	days?: string[] | number
	weeks?: string[] | number
	extras?: {
		name: string
		multiplier: number
	}[]
	rate?: {
		amount: number
		each: string
	}
	type?: string
	payments?: {
		date: string
		amount: number
		from?: string
		currency?: string
	}[]
	items?: Array<InvoiceItem>
	note?: string
	gst?: boolean
}
interface InvoiceParent extends InvoiceBase {
	id?: Id
}
interface InvoiceChild extends Partial<InvoiceBase> {
	inherit: Id
}
type InvoiceRaw = StrictUnion<InvoiceParent | InvoiceChild>
interface InvoicesRaw {
	[id: Id]: InvoiceRaw
}
export interface Invoice extends InvoiceBase {
	id: Id
	project: Project
	terms: Array<Id>
}
export interface Invoices {
	[id: Id]: Invoice
}

export interface Database {
	entities: Entities
	invoices: Invoices
	services: Services
	terms: Terms
	methods: Set<Method>
	idsOfUnpaidInvoices: Array<Id>
	idsOfPaidInvoices: Array<Id>
	unpaidAmount: number
}
