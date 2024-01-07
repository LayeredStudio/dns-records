import { DnsRecord } from './types.js';
/**
 * Get DNS records using the `dig` command
 */
export declare function getDnsRecordsDig(names: string | string[], types?: string | string[], server?: string): Promise<DnsRecord[]>;
