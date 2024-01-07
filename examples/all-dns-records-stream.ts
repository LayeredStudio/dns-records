import { DnsRecord, getAllDnsRecordsStream, parseDnsRecord } from '../src/index.ts'

// get the DNS Records stream. Notice await is not needed
const dnsRecordsStream = getAllDnsRecordsStream('shopify.com')

// decoder to convert the Uint8Array to a string
const decoder = new TextDecoder()

for await (const record of dnsRecordsStream) {
	// record is a Uint8Array, so we need to convert it to a string
	const dnsRecordLine = decoder.decode(record)
	console.log('DNS line', dnsRecordLine)

	// parse the DNS record line to a DnsRecord object
	const dnsRecord = parseDnsRecord(dnsRecordLine)
	//console.log('DNS object', dnsRecord)
}
