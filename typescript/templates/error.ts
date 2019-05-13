import { html } from '/vendor/lit-html.js'
import renderNav from './nav.js'

export default ({
	title,
	description
}: {
	title: string
	description: string
}) => {
	document.title = title
	return html`
		${renderNav()}
		<article class="error">
			<h1>${title}</h1>
			<h2>${description}</h2>
		</article>
	`
}
