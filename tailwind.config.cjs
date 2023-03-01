/** @type {import('tailwindcss').Config} */
module.exports = {
	content: ['./source/**/*.tsx', './node_modules/flowbite/**/*.js'],
	theme: {
		extend: {},
	},
	plugins: [require('flowbite/plugin')],
}
