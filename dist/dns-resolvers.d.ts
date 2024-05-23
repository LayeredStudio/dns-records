import { DnsRecord } from './index.js';
export declare function dnsRecordsCloudflare(name: string, type?: string): Promise<DnsRecord[]>;
export declare function dnsRecordsGoogle(name: string, type?: string): Promise<DnsRecord[]>;
/**
 * Get DNS records using the `dig` command in Node.js
 *
 * @param names The name(s) to query
 * @param types The DNS type(s) to query
 * @param server The DNS server to query. If not provided, the default DNS server on the network will be used
 * @returns The DNS records
 */
export declare function dnsRecordsNodeDig(names: string | string[], types?: string | string[], server?: string): Promise<DnsRecord[]>;
/**
 * Get DNS records using the Node.js DNS module
 *
 * @param names The name to query
 * @param types The DNS type to query
 * @returns The DNS records
 */
export declare function dnsRecordsNodeDns(name: string, type?: string): Promise<DnsRecord[]>;
