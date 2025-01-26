import { DnsRecord, getAllDnsRecords } from '../src/index.ts'

const domain = 'render.com'

const dnsRecords = await getAllDnsRecords(domain, {
	resolver: 'node-dig',
})

console.log(dnsRecords)
console.log(`${dnsRecords.length} DNS Records found ${domain} 👆`)
