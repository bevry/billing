import { has } from 'lib/util'
import type { Entity } from 'lib/types'
export interface Props {
	entity: Entity
}
export default function EntityComponent({ entity }: Props) {
	return (
		<table>
			<tbody>
				<tr>
					<th>Name</th>
					<td>{entity.name}</td>
				</tr>
				{has(entity.website) && (
					<tr>
						<th>Website</th>
						<td>
							<a href={entity.website} target="_blank">
								{entity.website}
							</a>
						</td>
					</tr>
				)}
				{has(entity.address) && (
					<tr>
						<th>Address</th>
						<td>
							{entity.address!.street}
							<br />
							{entity.address!.city} {entity.address!.zip}
							<br />
							{entity.address!.state}
							<br />
							{entity.address!.country}
							<br />
						</td>
					</tr>
				)}

				<tr>
					<th>Representative</th>
					<td>{entity.contact.name}</td>
				</tr>

				<tr>
					<th>Email</th>
					<td>
						<a href={`mailto:${entity.contact.email}`}>
							{entity.contact.email}
						</a>
					</td>
				</tr>
				{has(entity.contact.phone) && (
					<tr>
						<th>Phone</th>
						<td>{entity.contact.phone}</td>
					</tr>
				)}
				{has(entity.verification) &&
					Object.entries(entity.verification!).map(([k, v]) => (
						<tr key={k}>
							<th>{k}</th>
							<td>{v}</td>
						</tr>
					))}
			</tbody>
		</table>
	)
}
