import { getAllDnsRecords } from '../src/index.ts'

const domain = 'wordpress.org'

const allDnsRecords = await getAllDnsRecords(domain)

console.log(`${allDnsRecords.length} DNS Records found for ${domain}`)
console.log(allDnsRecords)
