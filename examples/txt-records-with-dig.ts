import { DnsRecord, getDnsRecords } from '../src/index.ts'

const domain = 'amazon.com'

const txtRecords: DnsRecord[] = await getDnsRecords(domain, 'TXT', 'node-dig')

console.log(`TXT records for ${domain}`)
console.log(txtRecords)
