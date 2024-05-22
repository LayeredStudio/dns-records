import { DnsRecord } from './index.js';
/**
 * Get DNS records using the `dig` command
 *
 * @param names The name(s) to query
 * @param types The DNS type(s) to query
 * @param server The DNS server to query. If not provided, the default DNS server on the network will be used
 * @returns The DNS records
 */
export declare function getDnsRecordsDig(names: string | string[], types?: string | string[], server?: string): Promise<DnsRecord[]>;
