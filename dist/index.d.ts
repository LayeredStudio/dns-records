/// <reference types="node" />
import { ReadableStream } from 'stream/web';
export type DnsRecord = {
    name: string;
    type: string;
    ttl: number;
    data: string;
};
export declare function getDnsRecords(name: string, type?: string, resolver?: string): Promise<DnsRecord[]>;
/**
 * Get DNS records using the `dig` command
 */
export declare function getDnsRecordsDig(names: string | string[], types?: string | string[], server?: string): Promise<DnsRecord[]>;
export type GetAllDnsRecordsOptions = {
    resolver?: 'cloudflare-dns' | 'google-dns' | 'node-dig';
    subdomains?: string[];
    dnsServer?: string;
};
export declare function getAllDnsRecordsStream(domain: string, options?: Partial<GetAllDnsRecordsOptions>): ReadableStream;
export declare function getAllDnsRecords(domain: string, options?: Partial<GetAllDnsRecordsOptions>): Promise<DnsRecord[]>;
export declare function parseDnsRecord(record: string | Uint8Array): DnsRecord;
