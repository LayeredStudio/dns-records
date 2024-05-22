import { DnsRecord, getAllDnsRecords } from '../src/index.ts'
import { getDnsRecordsDig } from '../src/node-resolvers.ts'

const domain = 'render.com'

const dnsRecords = await getAllDnsRecords(domain, {
    resolver: getDnsRecordsDig,
})

console.log(dnsRecords)
console.log(`${dnsRecords.length} DNS Records found ${domain} 👆`)
