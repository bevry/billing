import { Invoices } from '../types'
const invoices: Invoices = {
	'1': {
		id: '1',
		amount: 1,
		services: ['dev'],
		currency: 'USD',
		provider: 'me',
		client: 'them',
		project: {
			name: 'some project'
		},
		issued: '2000-01-01',
		paid: false,
		due: [2, 'weeks']
	}
}
export default Invoices
