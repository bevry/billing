import { html } from '/vendor/lit-html.js'
import { goto } from '../util.js'

export default () =>
	html`
		<header class="home">
			<a href="/" @click=${goto}>←</a>
		</header>
	`
