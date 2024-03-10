import { getAllDnsRecords } from '../src/index.ts'

const allDnsRecords = await getAllDnsRecords('wordpress.org')

console.log(allDnsRecords.length)
console.log(allDnsRecords)
