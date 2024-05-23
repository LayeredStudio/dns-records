/** DNS Record object, with type, ttl and value */
export interface DnsRecord {
    /** Fully qualified domain name (example.com, mail.google.com, analytics.x.com) */
    name: string;
    /** Record type: A, AAAA, CNAME, MX, TXT, etc. */
    type: string;
    /** Time to live (in seconds) for this record */
    ttl: number;
    /** Record data: IP for A or AAAA, fqdn for CNAME, etc */
    data: string;
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
export declare function getDnsRecords(name: string, type?: string, resolver?: string): Promise<DnsRecord[]>;
/** Options for discovering DNS records. */
export type GetAllDnsRecordsOptions = {
    /**
     * Which DNS resolver to use for DNS lookup.
     *
     * Options: cloudflare-dns, google-dns, node-dns, node-dig, deno-dns
     */
    resolver?: 'cloudflare-dns' | 'google-dns' | 'node-dns' | 'node-dig' | 'deno-dns';
    /** Skip DNS check for common subdomains from built-in list. `true` by default */
    commonSubdomainsCheck?: boolean;
    /** List of extra subdomains to check for */
    subdomains?: string[];
};
/**
 * Discover all DNS records for a domain name and stream each record as a text line.
 *
 * @param domain Valid domain name.
 * @param options Options for DNS resolver, extra subdomains to check, etc.
 * @returns ReadableStream of DNS records.
 */
export declare function getAllDnsRecordsStream(domain: string, options?: Partial<GetAllDnsRecordsOptions>): ReadableStream;
/**
 * Discover all DNS records for a domain name and return an array of records.
 *
 * @param domain Valid domain name.
 * @param options Options for DNS resolver, extra subdomains to check, etc.
 * @returns Array of all `DnsRecord` discovered for the domain, with wildcard records added.
 *
 * @example Get all DNS records for example.com
 * ```js
 * import { getAllDnsRecords } from '@layered/dns-records'
 *
 * const records = await getAllDnsRecords('example.com')
 * ```
 */
export declare function getAllDnsRecords(domain: string, options?: Partial<GetAllDnsRecordsOptions>): Promise<DnsRecord[]>;
/**
 * Parse a DNS record string into a DnsRecord object.
 *
 * @param record DNS record string.
 * @returns `DnsRecord` object.
 */
export declare function parseDnsRecord(record: string | Uint8Array): DnsRecord;
/**
 * Detect wildcard DNS records and return a new array with the wildcard records added.
 *
 * @param domain Domain name.
 * @param records Array of DNS records.
 * @param percent Percentage of records with the same data to consider a wildcard.
 * @returns Array of DNS records with wildcard records grouped as `*.domain`.
 */
export declare function detectWildcardRecords(domain: string, records: DnsRecord[], percent?: number): DnsRecord[];
