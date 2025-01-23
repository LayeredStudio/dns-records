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
/** Options for discovering DNS records. */
export type GetAllDnsRecordsOptions = {
    /** Which DNS resolver to use for DNS lookup. */
    resolver?: 'cloudflare-dns' | 'google-dns' | 'node-dns' | 'node-dig' | 'deno-dns';
    /** Check for common subdomains from built-in list. `true` by default */
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
export declare function getAllDnsRecordsStream(domain: string, options?: GetAllDnsRecordsOptions): ReadableStream;
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
export declare function getAllDnsRecords(domain: string, options?: GetAllDnsRecordsOptions): Promise<DnsRecord[]>;
/**
 * Parse a DNS record string into a DnsRecord object.
 *
 * @param record DNS record string.
 * @returns `DnsRecord` object.
 */
export declare function parseDnsRecord(record: string | Uint8Array): DnsRecord;
/**
 * Detect wildcard DNS records and return a new array with the wildcard record added.
 *
 * @param domain Domain name.
 * @param records Array of DNS records.
 * @param percent Percentage of records with the same data to consider a wildcard.
 * @returns Array of DNS records with wildcard records grouped as `*.domain`.
 */
export declare function detectWildcardRecords(domain: string, records: DnsRecord[], percent?: number): DnsRecord[];
