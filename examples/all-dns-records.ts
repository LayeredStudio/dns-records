import { type DnsRecord, getAllDnsRecords } from '../src/index.ts'

const allDnsRecords: DnsRecord[] = await getAllDnsRecords('example.com')

console.log(allDnsRecords)
console.log(allDnsRecords.length)
