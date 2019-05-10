import * as fsUtil from 'fs'
import * as pathUtil from 'path'

import entities from '../data/entities'
import invoices from '../data/invoices'
import services from '../data/services'
import terms from '../data/terms'

const data = { entities, invoices, services, terms }
const path = pathUtil.resolve(process.cwd(), 'www', 'index.json')
const json = JSON.stringify(data, null, '')

fsUtil.promises
	.writeFile(path, json)
	.then(() => console.log('wrote', path))
	.catch(console.error)
