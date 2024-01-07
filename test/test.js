import { strict as assert } from 'node:assert'
import test from 'node:test'

import { getDnsRecords, getAllDnsRecords } from '../dist/index.js'

test('get name servers for google.com (NS)', async () => {
	const expectedNs = ['ns1.google.com.', 'ns2.google.com.', 'ns3.google.com.', 'ns4.google.com.']

	const [ nsRecordsWithCloudflareDns, nsRecordsWithGoogleDns ] = await Promise.all([
		getDnsRecords('google.com', 'NS', 'cloudflare-dns'),
		getDnsRecords('google.com', 'NS', 'google-dns'),
	])

	assert.equal(nsRecordsWithCloudflareDns.length, expectedNs.length, 'Number of NameServers doesn\'t match')
	assert.ok(expectedNs.some(ns => ns === nsRecordsWithCloudflareDns[1].data), 'Returned NS doesn\'t match')
	assert.ok(expectedNs.some(ns => ns === nsRecordsWithCloudflareDns[1].data), 'Returned NS doesn\'t match')

	assert.equal(nsRecordsWithGoogleDns.length, expectedNs.length, 'Number of NameServers doesn\'t match')
	assert.ok(expectedNs.some(ns => ns === nsRecordsWithGoogleDns[1].data), 'Returned NS doesn\'t match')
	assert.ok(expectedNs.some(ns => ns === nsRecordsWithGoogleDns[1].data), 'Returned NS doesn\'t match')
});

test('get A records for "mañana.com" (IDN)', async () => {
	const [ aRecordsWithCloudflareDns, aRecordsWithGoogleDns ] = await Promise.all([
		getDnsRecords('mañana.com', 'A', 'cloudflare-dns'),
		getDnsRecords('mañana.com', 'A', 'google-dns'),
	])

	assert.notEqual(aRecordsWithCloudflareDns.length, 0, 'No A records returned')
	assert.equal(aRecordsWithCloudflareDns.length, aRecordsWithGoogleDns.length, 'A records length between `google-dns` and `cloudflare-dns` doesn\'t match')
});

test('get TXT records for "cloudflare.com"', async () => {
	const [ txtRecordsWithCloudflareDns, txtRecordsWithGoogleDns ] = await Promise.all([
		getDnsRecords('cloudflare.com', 'TXT', 'cloudflare-dns'),
		getDnsRecords('cloudflare.com', 'TXT', 'google-dns'),
	])

	assert.notEqual(txtRecordsWithCloudflareDns.length, 0, 'No TXT records returned')
	assert.equal(txtRecordsWithCloudflareDns.length, txtRecordsWithGoogleDns.length, 'TXT records length between `google-dns` and `cloudflare-dns` doesn\'t match')
});

test('get all DNS records for "x.com"', async () => {
	const dnsRecords = await getAllDnsRecords('x.com')

	assert.notEqual(dnsRecords.length, 0, 'No DNS Records returned')
	assert.notEqual(dnsRecords.find(record => record.type === 'NS').length > 0, 'No NS records returned')
	assert.notEqual(dnsRecords.find(record => record.type === 'A').length, 0, 'No A records returned')
	assert.notEqual(dnsRecords.find(record => record.type === 'MX').length > 0, 'No MX records returned')
	assert.notEqual(dnsRecords.find(record => record.type === 'TXT').length > 0, 'No TXT records returned')
});

/* 
test('should detect the wildcard subdomains for "wordpress.org"', async () => {
	const records = await getAllRecords('wordpress.org')
	const as = records.A.map(record => record.name)
	const cnames = records.CNAME.map(record => record.name)

	assert(records.A.length > 0, 'No A records returned')
	assert(records.NS.length > 0, 'No NS records returned')
	assert(as.includes('*.wordpress.org'), 'No * record found for A')
	assert(cnames.includes('*.wordpress.org'), 'No * record found for CNAME')
});
*/
