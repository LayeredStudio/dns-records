import { DnsRecord, getDnsRecords } from '../src/index.ts'
import { getDnsRecordsDig } from '../src/resolver-node-dig.ts'

const domain = 'amazon.com'

const txtRecords = await getDnsRecordsDig(domain, 'TXT')

console.log(`TXT records for ${domain}`)
console.log(txtRecords)
