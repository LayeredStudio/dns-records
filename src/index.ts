import { toASCII } from 'punycode'
import { dnsRecordsCloudflare, dnsRecordsGoogle, dnsRecordsNodeDig, dnsRecordsNodeDns } from './dns-resolvers.js'
import { subdomainsRecords } from './subdomains.js'

/** DNS Record object, with type, ttl and value */
export interface DnsRecord {
	/** Fully qualified domain name (example.com, mail.google.com, analytics.x.com) */
	name: string
	/** Record type: A, AAAA, CNAME, MX, TXT, etc. */
	type: string
	/** Time to live (in seconds) for this record */
	ttl: number
	/** Record data: IP for A or AAAA, fqdn for CNAME, etc */
	data: string
}

const isTld = (tld: string): boolean => {
	if (tld.startsWith('.')) {
		tld = tld.substring(1)
	}

	return /^([a-z]{2,64}|xn[a-z0-9-]{5,})$/i.test(toASCII(tld))
}

/**
 * Basic check to test if a string is a valid domain name.
 * 
 * @param domain Fully qualified domain name.
 * @returns True if the string is a valid format for a domain name
 */
const isDomain = (domain: string): boolean => {
	if (domain.endsWith('.')) {
		domain = domain.substring(0, domain.length - 1)
	}

	const labels = toASCII(domain).split('.').reverse()
	const labelTest = /^([a-z0-9-_]{1,64}|xn[a-z0-9-]{5,})$/i

	return labels.length > 1 && labels.every((label, index) => {
		return index ? !label.startsWith('-') && !label.endsWith('-') && labelTest.test(label) : isTld(label)
	})
}

function bestDnsResolverForThisRuntime(): string {
	if (globalThis.process?.release?.name === 'node') {
		return 'node-dns'
	} else if (globalThis.navigator?.userAgent === 'Cloudflare-Workers') {
		return 'cloudflare-dns'
	} else {
		return 'google-dns'
	}
}

/**
 * Get DNS records of a given type for a FQDN.
 * 
 * @param name Fully qualified domain name.
 * @param type DNS record type: A, AAAA, TXT, CNAME, MX, etc.
 * @param resolver Which DNS resolver to use. If not specified, the best DNS resolver for this runtime will be used.
 * @returns Array of discovered `DnsRecord` objects.
 * 
 * @example Get TXT records for example.com
 * ```js
 * import { getDnsRecords } from '@layered/dns-records'
 * 
 * const txtRecords = await getDnsRecords('example.com', 'TXT')
 * ```
 * 
 * @example Get MX records for android.com from Google DNS resolver
 * ```js
 * import { getDnsRecords } from '@layered/dns-records'
 * 
 * const mxRecords = await getDnsRecords('android.com', 'MX', 'google-dns')
 * ```
 */
export async function getDnsRecords(name: string, type: string = 'A', resolver?: string): Promise<DnsRecord[]> {
	if (!isDomain(name)) {
		throw new Error(`"${name}" is not a valid domain name`)
	}

	if (!resolver) {
		resolver = bestDnsResolverForThisRuntime()
	}

	if (resolver === 'cloudflare-dns') {
		return dnsRecordsCloudflare(name, type)
	} else if (resolver === 'google-dns') {
		return dnsRecordsGoogle(name, type)
	} else if (resolver === 'node-dig') {
		return dnsRecordsNodeDig(name, type)
	} else if (resolver === 'node-dns') {
		return dnsRecordsNodeDns(name, type)
	} else if (resolver === 'deno-dns') {
		throw new Error('Deno DNS not yet implemented')
	}

	throw new Error(`Invalid DNS resolver: ${resolver}`)
}

/** Options for discovering DNS records. */
export type GetAllDnsRecordsOptions = {
	/** Which DNS resolver to use for DNS lookup. */
	resolver?: 'cloudflare-dns' | 'google-dns' | 'node-dns' | 'node-dig' | 'deno-dns'
	/** Check for common subdomains from built-in list. `true` by default */
	commonSubdomainsCheck?: boolean
	/** List of extra subdomains to check for */
	subdomains?: string[]
}

/**
 * Discover all DNS records for a domain name and stream each record as a text line.
 * 
 * @param domain Valid domain name.
 * @param options Options for DNS resolver, extra subdomains to check, etc.
 * @returns ReadableStream of DNS records.
 */
export function getAllDnsRecordsStream(domain: string, options: Partial<GetAllDnsRecordsOptions> = {}): ReadableStream {
	options = {
		subdomains: [],
		commonSubdomainsCheck: true,
		...options,
	}

	if (!isDomain(domain)) {
		throw new Error(`"${domain}" is not a valid domain name`)
	}

	domain = toASCII(domain)

	const encoder = new TextEncoder();
	const { readable, writable } = new TransformStream();
	const writer = writable.getWriter();

	// found records
	const recordsHashes: String[] = []

	// records that can expose subdomains
	const subdomainsChecked: String[] = []
	const subdomainsExtra: String[] = []
	if (options.subdomains) {
		subdomainsExtra.push(...options.subdomains)
	}
	if (options.commonSubdomainsCheck) {
		subdomainsExtra.push(...subdomainsRecords)
	}

	const sendRecord = (record: DnsRecord) => {
		const hash = `${record.name}-${record.type}-${record.data}`

		if (!recordsHashes.includes(hash) && record.name.endsWith(domain)) {
			recordsHashes.push(hash)
			writer.write(encoder.encode([ record.name, record.ttl, 'IN', record.type, record.data ].join('\t')));
		}
	}

	let runningChecks = 5

	const sendRecords = (records: DnsRecord[]) => {
		records.forEach(r => sendRecord(r))

		reqDone()
	}

	const reqDone = () => {
		// if we have all the records, check for subdomains
		if (--runningChecks === 0) {

			// check for A,AAAA,CNAME subdomains
			while (subdomainsExtra.length) {
				const subdomain = subdomainsExtra.shift()

				if (subdomain && !subdomainsChecked.includes(subdomain)) {
					runningChecks++
					subdomainsChecked.push(subdomain)
					getDnsRecords(`${subdomain}.${domain}`, 'A', options.resolver).then(sendRecords)
				}
			}

			//todo check for txt records for subdomains
		}

		if (runningChecks === 0) {
			writer.close()
		}
	}

	const addSubdomain = (value: string) => {
		value = value.endsWith('.') ? value.slice(0, -1) : value

		if (value.endsWith(`.${domain}`)) {
			const subdomain = value.replace(`.${domain}`, '')
			if (!subdomainsExtra.includes(subdomain)) {
				subdomainsExtra.push(subdomain)
			}
		}
	}

	// first check - NS records
	getDnsRecords(domain, 'NS', options.resolver).then(nsRecords => {
		if (nsRecords.length) {
			nsRecords.forEach(r => {
				sendRecord(r)

				if (r.data.includes(domain)) {
					addSubdomain(r.data)
				}
			})

			getDnsRecords(domain, 'SOA', options.resolver).then(sendRecords)
			//getDnsRecords(domain, 'CAA').then(sendRecords)
			getDnsRecords(domain, 'A', options.resolver).then(sendRecords)
			getDnsRecords(domain, 'AAAA', options.resolver).then(sendRecords)

			getDnsRecords(domain, 'MX', options.resolver).then(records => {
				records.forEach(r => {
					if (r.data.includes(domain)) {
						const parts: String[] = r.data.split(' ')

						if (parts.length > 1) {
							addSubdomain(String(parts[1]))
						}
					}
				})

				sendRecords(records)
			})

			getDnsRecords(domain, 'TXT', options.resolver).then(records => {
				records.forEach(r => {
					// extract subdomains from SPF records
					// https://datatracker.ietf.org/doc/html/rfc7208
					if (r.data.includes('v=spf1') && r.data.includes(domain)) {
						r.data.split(' ').forEach(spf => {
							if (spf.startsWith('include:') && spf.endsWith(domain)) {
								addSubdomain(spf.replace('include:', ''))
							} else if (spf.startsWith('a:') && spf.endsWith(domain)) {
								addSubdomain(spf.replace('a:', ''))
							} else if (spf.startsWith('mx:') && spf.endsWith(domain)) {
								addSubdomain(spf.replace('mx:', ''))
							}
						})
					}
				})

				sendRecords(records)
			})
		} else {
			writer.close()
		}
	})

	return readable
}

/**
 * Discover all DNS records for a domain name and return an array of records.
 * 
 * @param domain Valid domain name.
 * @param options Options for DNS resolver, extra subdomains to check, etc.
 * @returns Array of all `DnsRecord` discovered for the domain, with wildcard record added.
 * 
 * @example Get all DNS records for example.com with best-for-runtime DNS resolver
 * ```js
 * import { getAllDnsRecords } from '@layered/dns-records'
 * 
 * const records = await getAllDnsRecords('example.com')
 * ```
 * 
 * @example Get all DNS records from `cloudflare-dns` DNS resolver
 * ```js
 * import { getAllDnsRecords } from '@layered/dns-records'
 * 
 * const records = await getAllDnsRecords('example.com', {
 *   resolver: 'cloudflare-dns',
 * })
 * ```
 */
export async function getAllDnsRecords(domain: string, options: Partial<GetAllDnsRecordsOptions> = {}): Promise<DnsRecord[]> {
	const records: DnsRecord[] = []
	const dnsRecordsStream = getAllDnsRecordsStream(domain, options)

	const reader = dnsRecordsStream.getReader();

	return new Promise((resolve, reject) => {
		const read = () => {
			reader.read().then(({done, value}) => {
				if (done) {
					resolve(detectWildcardRecords(domain, records))
				} else {
					records.push(parseDnsRecord(value))
					read()
				}
			}).catch(reject)
		}
	
		read();
	})
}

/**
 * Parse a DNS record string into a DnsRecord object.
 * 
 * @param record DNS record string.
 * @returns `DnsRecord` object.
 */
export function parseDnsRecord(record: string|Uint8Array): DnsRecord {
	if (record instanceof Uint8Array) {
		record = new TextDecoder().decode(record)
	}

	const parts = record.split('\t')

	if (parts.length < 5 || parts[2] !== 'IN') {
		throw new Error(`Invalid DNS record: ${record}`)
	}

	return {
		name: String(parts[0]),
		ttl: Number(parts[1]),
		type: String(parts[3]),
		data: String(parts[4]),
	}
}

/**
 * Detect wildcard DNS records and return a new array with the wildcard record added.
 * 
 * @param domain Domain name.
 * @param records Array of DNS records.
 * @param percent Percentage of records with the same data to consider a wildcard.
 * @returns Array of DNS records with wildcard records grouped as `*.domain`.
 */
export function detectWildcardRecords(domain: string, records: DnsRecord[], percent = 0.15): DnsRecord[] {
	const sameDataGroup: { [key: string]: number } = {}
	const wildcardsFound: string[] = []

	records.forEach(record => {
		if (['A', 'AAAA', 'CNAME'].includes(record.type)) {
			const key = `${record.type}-${record.data}`
			sameDataGroup[key] ||= 0
			sameDataGroup[key]++
		}
	})

	const recordsWithWildcard: DnsRecord[] = []

	records.forEach(record => {
		if (['A', 'AAAA', 'CNAME'].includes(record.type)) {
			const key = `${record.type}-${record.data}`
			const sameData = sameDataGroup[key] || 0
			const recordTypeLength = records.filter(r => r.type === record.type).length

			// ?? make the formula easier to understand, already don't know how it works
			if (sameData / recordTypeLength < percent || recordTypeLength < subdomainsRecords.length / 2) {
				recordsWithWildcard.push(record)
			} else if (!wildcardsFound.includes(key)) {
				wildcardsFound.push(key)
				recordsWithWildcard.push({
					...record,
					name: `*.${domain}`,
				})
			}
		} else {
			recordsWithWildcard.push(record)
		}
	})

	return recordsWithWildcard
}
