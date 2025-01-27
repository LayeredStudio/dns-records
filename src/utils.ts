
/**
 * Basic check to test if a string is a valid domain name.
 * 
 * @param domain Fully qualified domain name, like example.com or mail.google.com (no protocol or path)
 * @returns Domain in ASCII format
 */
export function validatedDomain(domain: string): string {
	if (domain.endsWith('.')) {
		domain = domain.substring(0, domain.length - 1)
	}

	try {
		const url = new URL(`http://${domain.trim()}`)
		domain = url.hostname
	} catch (error) {
		throw new Error(`"${domain}" is not a valid domain name`)
	}

	const labels = domain.split('.').reverse()
	const labelTest = /^([a-z0-9-_]{1,64}|xn[a-z0-9-]{5,})$/i
	const tldTest = /^([a-z]{2,64}|xn[a-z0-9-]{5,})$/i

	const isValidFormat = labels.length > 1 && labels.every((label, index) => {
		return index ? !label.startsWith('-') && !label.endsWith('-') && labelTest.test(label) : tldTest.test(label)
	})

	if (!isValidFormat) {
		throw new Error(`"${domain}" is not a valid domain name`)
	}

	return domain
}
