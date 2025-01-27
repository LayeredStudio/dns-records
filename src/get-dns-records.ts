import { dnsRecordsCloudflare, dnsRecordsGoogle, dnsRecordsNodeDig, dnsRecordsNodeDns } from './dns-resolvers.js'
import { type DnsRecord } from './index.js'
import { validatedDomain } from './utils.js'

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
 * @param name Fully qualified domain name, like example.com or mail.google.com (no protocol or path)
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
	name = validatedDomain(name)

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
