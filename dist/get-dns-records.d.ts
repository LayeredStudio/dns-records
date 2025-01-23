import { type DnsRecord } from './index.js';
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
export declare function getDnsRecords(name: string, type?: string, resolver?: string): Promise<DnsRecord[]>;
