import { toASCII } from 'punycode'
import { DnsRecord } from './index.js'

const dnsTypeNumbers: { [key: number]: string } = {
	1: 'A',
	2: 'NS',
	5: 'CNAME',
	6: 'SOA',
	12: 'PTR',
	15: 'MX',
	16: 'TXT',
	24: 'SIG',
	25: 'KEY',
	28: 'AAAA',
	33: 'SRV',
	257: 'CAA',
}

export async function dnsRecordsCloudflare(name: string, type: string = 'A'): Promise<DnsRecord[]> {
	const re = await fetch(`https://cloudflare-dns.com/dns-query?name=${toASCII(name)}&type=${type}&cd=1`, {
		headers: {
			accept: 'application/dns-json',
		}
	})

	if (!re.ok) {
		throw new Error(`Error fetching DNS records for ${name}: ${re.status} ${re.statusText}`)
	}

	const json: any = await re.json()
	const records: DnsRecord[] = (json.Answer || []).map((record: any) => {
		const type = dnsTypeNumbers[record.type] || String(record.type)
		let data = record.data

		if (['CNAME', 'NS'].includes(type) && data.endsWith('.')) {
			data = data.slice(0, -1)
		}

		return { name: record.name, type, ttl: record.TTL, data }
	})

	return records
}

export async function dnsRecordsGoogle(name: string, type: string = 'A'): Promise<DnsRecord[]> {
	const re = await fetch(`https://dns.google/resolve?name=${toASCII(name)}&type=${type}&cd=1`)

	if (!re.ok) {
		throw new Error(`Error fetching DNS records for ${name}: ${re.status} ${re.statusText}`)
	}

	const json: any = await re.json()
	const records: DnsRecord[] = (json.Answer || []).map((record: any) => {
		const type = dnsTypeNumbers[record.type] || String(record.type)
		let data = record.data

		if (['CNAME', 'NS'].includes(type) && data.endsWith('.')) {
			data = data.slice(0, -1)
		}

		return {
			name: record.name,
			type,
			ttl: record.TTL,
			data,
		}
	})

	return records
}

/**
 * Get DNS records using the `dig` command in Node.js
 * 
 * @param names The name(s) to query
 * @param types The DNS type(s) to query
 * @param server The DNS server to query. If not provided, the default DNS server on the network will be used
 * @returns The DNS records
 */
export async function dnsRecordsNodeDig(names: string | string[], types: string | string[] = 'A', server?: string): Promise<DnsRecord[]> {
	// start building the arguments list for the `dig` command
	const args = []

	// append @ to server if not present
	if (server) {
		if (!server.startsWith('@')) {
			server = `@${server}`
		}

		args.push(server)
	}

	if (!Array.isArray(names)) {
		names = [names]
	}

	names.forEach(name => {
		name = toASCII(name)

		if (Array.isArray(types) && types.length) {
			types.forEach(type => {
				args.push(name, type)
			})
		} else if (types && typeof types === 'string') {
			args.push(name, types)
		} else {
			args.push(name)
		}
	})

	// +noall'		// don't display any texts (authority, question, stats, etc) in response,
	// +answer		// except the answer
	// +cdflag		// no DNSSEC check, faster
	// https://linux.die.net/man/1/dig

	const { spawnSync } = await import('node:child_process')

	const dig = spawnSync('dig', [...args, '+noall', '+answer', '+cdflag'])
	let re = dig.stdout.toString()

	const dnsRecords: DnsRecord[] = []

	// split lines & ignore comments or empty
	re.split("\n")
		.filter(line => line.length && !line.startsWith(';'))
		.forEach(line => {
			// replace tab(s) with space, then split by space
			const parts = line.replace(/[\t]+/g, " ").split(" ")

			let name = String(parts[0])
			const type = String(parts[3])
			let data = parts.slice(4).join(" ")

			if (name.endsWith('.')) {
				name = name.slice(0, -1)
			}

			if (['CNAME', 'NS'].includes(type) && data.endsWith('.')) {
				data = data.slice(0, -1)
			}
	
			dnsRecords.push({ name, ttl: Number(parts[1]), type, data })
		})

	return dnsRecords
}

/**
 * Get DNS records using the Node.js DNS module
 * 
 * @param names The name to query
 * @param types The DNS type to query
 * @returns The DNS records
 */
export async function dnsRecordsNodeDns(name: string, type: string = 'A'): Promise<DnsRecord[]> {
	const { promises: dns } = await import('node:dns')
	type = type.toUpperCase()

	const dnsRecords: DnsRecord[] = []

	try {
		if (['A', 'AAAA'].includes(type)) {
			const foundRecords = type === 'A' ? await dns.resolve4(name, { ttl: true }) : await dns.resolve6(name, { ttl: true })

			foundRecords.forEach(record => {
				dnsRecords.push({
					name,
					type,
					ttl: record.ttl,
					data: record.address,
				})
			})
		} else if (type === 'CNAME') {
			const foundRecords = await dns.resolveCname(name)

			foundRecords.forEach(record => {
				dnsRecords.push({
					name,
					type,
					ttl: 0,
					data: record,
				})
			})
		} else if (type === 'MX') {
			const foundRecords = await dns.resolveMx(name)

			foundRecords.forEach(record => {
				dnsRecords.push({
					name,
					type,
					ttl: 0,
					data: `${record.priority} ${record.exchange}`,
				})
			})
		} else if (type === 'NS') {
			const foundRecords = await dns.resolveNs(name)

			foundRecords.forEach(record => {
				dnsRecords.push({
					name,
					type,
					ttl: 0,
					data: record,
				})
			})
		} else if (type === 'SOA') {
			const foundRecords = await dns.resolveSoa(name)

			dnsRecords.push({
				name,
				type,
				ttl: 0,
				data: Object.values(foundRecords).join(' '),
			})
		} else if (type === 'TXT') {
			const foundRecords = await dns.resolveTxt(name)

			foundRecords.forEach(record => {
				dnsRecords.push({
					name,
					type,
					ttl: 0,
					data: record.join(' '),
				})
			})
		}
	} catch (e) {}

	return dnsRecords
}
