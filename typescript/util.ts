export function goto(e: MouseEvent) {
	const el = e.target as Element
	history.pushState({}, 'Bevry Billing', el.getAttribute('href'))
	e.preventDefault()
	window.dispatchEvent(new Event('popstate'))
	return false
}
