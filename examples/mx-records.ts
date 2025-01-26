import { type DnsRecord, getDnsRecords } from '../src/index.ts'

const domain = 'apple.com'

const mxRecords: DnsRecord[] = await getDnsRecords(domain, 'MX')

console.log(`${mxRecords.length} MX records (email servers) for ${domain}`)
console.log(mxRecords)
