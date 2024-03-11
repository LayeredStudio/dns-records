export type DnsRecord = {
    name: string;
    type: string;
    ttl: number;
    data: string;
};
/**
 * Get DNS records of a given type for a FQDN.
 * @param name Fully qualified domain name.
 * @param type DNS record type: A, AAAA, TXT, CNAME, MX, etc.
 * @param resolver DNS resolver to use. Default: cloudflare-dns.
 */
export declare function getDnsRecords(name: string, type?: string, resolver?: string | Function): Promise<DnsRecord[]>;
export type GetAllDnsRecordsOptions = {
    resolver?: string | Function;
    subdomains?: string[];
};
/**
 * Discover all DNS records for a given domain and stream each record as a text line.
 * @param domain Valid domain name.
 * @param options Options for DNS resolver, extra subdomains to check, etc.
 */
export declare function getAllDnsRecordsStream(domain: string, options?: Partial<GetAllDnsRecordsOptions>): ReadableStream;
/**
 * Discover all DNS records for a given domain and return an array of records.
 * @param domain Valid domain name.
 * @param options Options for DNS resolver, extra subdomains to check, etc.
 */
export declare function getAllDnsRecords(domain: string, options?: Partial<GetAllDnsRecordsOptions>): Promise<DnsRecord[]>;
/**
 * Parse a DNS record string into a DnsRecord object.
 * @param record DNS record string.
 */
export declare function parseDnsRecord(record: string | Uint8Array): DnsRecord;
/**
 * Detect wildcard DNS records and return a new array with the wildcard records added.
 * @param domain Domain name.
 * @param records Array of DNS records.
 * @param percent Percentage of records with the same data to consider a wildcard.
 */
export declare function detectWildcardRecords(domain: string, records: DnsRecord[], percent?: number): DnsRecord[];
