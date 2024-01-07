import { DnsRecord, getAllDnsRecords } from '../src/index.ts'

const allDnsRecords = await getAllDnsRecords('example.com')

console.log(allDnsRecords)
console.log(allDnsRecords.length)
