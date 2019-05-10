import { html, nothing } from '/vendor/lit-html.js'
import { Entity } from '../types'
export default (entity: Entity) => html`
	<table>
		<tbody>
			<tr>
				<th>Name</th>
				<td>${entity.name}</td>
			</tr>

			${entity.website
				? html`
						<tr>
							<th>Website</th>
							<td>
								<a href="${entity.website}" target="_blank">
									${entity.website}
								</a>
							</td>
						</tr>
				  `
				: nothing}
			${entity.address
				? html`
						<tr>
							<th>Address</th>
							<td>
								<pre>
${entity.address.street}
${entity.address.city} ${entity.address.zip}
${entity.address.state}
${entity.address.country}</pre
								>
							</td>
						</tr>
				  `
				: nothing}

			<tr>
				<th>Representative</th>
				<td>${entity.contact.name}</td>
			</tr>

			<tr>
				<th>Email</th>
				<td>
					<a href="mailto:${entity.contact.email}">
						${entity.contact.email}
					</a>
				</td>
			</tr>

			${entity.contact.phone
				? html`
						<tr>
							<th>Phone</th>
							<td>${entity.contact.phone}</td>
						</tr>
				  `
				: nothing}
			${entity.verification
				? Object.entries(entity.verification).map(
						([k, v]) => html`
							<tr>
								<th>${k}</th>
								<td>${v}</td>
							</tr>
						`
				  )
				: nothing}
		</tbody>
	</table>
`
