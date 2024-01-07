import { DnsRecord, getDnsRecords } from '../src/index.ts'

const domain = 'example.com'

const txtRecords = await getDnsRecords(domain, 'TXT', 'google-dns')

console.log(`TXT records for ${domain}`)
console.log(txtRecords)

const txtSpfRecord = txtRecords.find(r => r.data.includes('v=spf1'))

console.log(`SPF record found`)
console.log(txtSpfRecord ? '✅' : '❌')
