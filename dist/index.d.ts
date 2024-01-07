import type { DnsRecord } from './types.js';
export declare function getDnsRecords(name: string, type?: string, resolver?: string): Promise<DnsRecord[]>;
export type GetAllDnsRecordsOptions = {
    resolver?: string;
    subdomains?: string[];
};
export declare function getAllDnsRecordsStream(domain: string, options?: Partial<GetAllDnsRecordsOptions>): ReadableStream;
export declare function getAllDnsRecords(domain: string, options?: Partial<GetAllDnsRecordsOptions>): Promise<DnsRecord[]>;
export declare function parseDnsRecord(record: string | Uint8Array): DnsRecord;
