import { DnsRecord, getDnsRecords } from '../src/index.ts'

const domain = 'example.com'

const txtRecords = await getDnsRecords(domain, 'TXT')

console.log(`${txtRecords.length} TXT records found for ${domain}`)
console.log(txtRecords)

const txtSpfRecord = txtRecords.find(r => r.data.includes('v=spf1'))

console.log(`SPF record:`, txtSpfRecord ? '✅ found' : '❌ not found')
