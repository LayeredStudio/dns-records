import { DnsRecord, getDnsRecords } from '../src/index.ts'

const domain = 'apple.com'

const mxRecords: DnsRecord[] = await getDnsRecords(domain, 'MX')

console.log(`MX records (email servers) for ${domain}`)
console.log(mxRecords)
