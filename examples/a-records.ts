import { DnsRecord, getDnsRecords } from '../src/index.ts'

const domain = 'apple.com'

const aRecords: DnsRecord[] = await getDnsRecords(domain, 'A')

console.log(`A records for ${domain}`)
console.log(aRecords)
