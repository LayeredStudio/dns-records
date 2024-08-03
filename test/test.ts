import { strict as assert } from 'node:assert'
import test from 'node:test'

import { getDnsRecords, getAllDnsRecords } from '../src/index.ts'

test('get name servers for google.com (NS)', async () => {
	const expectedNs = ['ns1.google.com', 'ns2.google.com', 'ns3.google.com', 'ns4.google.com']

	const [ nsRecordsWithCloudflareDns, nsRecordsWithGoogleDns, nsRecordsWithNodeDns, nsRecordsWithNodeDig ] = await Promise.all([
		getDnsRecords('google.com', 'NS', 'cloudflare-dns'),
		getDnsRecords('google.com', 'NS', 'google-dns'),
		getDnsRecords('google.com', 'NS', 'node-dns'),
		getDnsRecords('google.com', 'NS', 'node-dig'),
	])

	assert.equal(nsRecordsWithCloudflareDns.length, expectedNs.length, 'CloudFlare DNS, Number of NameServers doesn\'t match')
	assert.ok(expectedNs.some(ns => ns === nsRecordsWithCloudflareDns[1].data), 'Returned NS doesn\'t match')
	assert.ok(expectedNs.some(ns => ns === nsRecordsWithCloudflareDns[1].data), 'Returned NS doesn\'t match')

	assert.equal(nsRecordsWithGoogleDns.length, expectedNs.length, 'Google DNS, Number of NameServers doesn\'t match')
	assert.ok(expectedNs.some(ns => ns === nsRecordsWithGoogleDns[1].data), 'Returned NS doesn\'t match')
	assert.ok(expectedNs.some(ns => ns === nsRecordsWithGoogleDns[1].data), 'Returned NS doesn\'t match')

	assert.equal(nsRecordsWithNodeDns.length, expectedNs.length, 'Node DNS, Number of NameServers doesn\'t match')
	assert.ok(expectedNs.some(ns => ns === nsRecordsWithNodeDns[1].data), 'Returned NS doesn\'t match')
	assert.ok(expectedNs.some(ns => ns === nsRecordsWithNodeDns[1].data), 'Returned NS doesn\'t match')

	assert.equal(nsRecordsWithNodeDig.length, expectedNs.length, 'Node dig, Number of NameServers doesn\'t match')
	assert.ok(expectedNs.some(ns => ns === nsRecordsWithNodeDig[1].data), 'Returned NS doesn\'t match')
	assert.ok(expectedNs.some(ns => ns === nsRecordsWithNodeDig[1].data), 'Returned NS doesn\'t match')
});

test('get A records for "mañana.com" (IDN)', async () => {
	const [ aRecordsWithCloudflareDns, aRecordsWithGoogleDns, aRecordsWithNodeDns ] = await Promise.all([
		getDnsRecords('mañana.com', 'A', 'cloudflare-dns'),
		getDnsRecords('mañana.com', 'A', 'google-dns'),
		getDnsRecords('mañana.com', 'A', 'node-dns'),
	])

	assert.notEqual(aRecordsWithCloudflareDns.length, 0, 'No A records returned')
	assert.equal(aRecordsWithCloudflareDns.length, aRecordsWithGoogleDns.length, 'A records length between `google-dns` and `cloudflare-dns` doesn\'t match')
	assert.equal(aRecordsWithGoogleDns.length, aRecordsWithNodeDns.length, 'A records length between `google-dns` and `cloudflare-dns` doesn\'t match')
});

test('get TXT records for "cloudflare.com"', async () => {
	const [ txtRecordsWithCloudflareDns, txtRecordsWithGoogleDns, txtRecordsWithNodeDns ] = await Promise.all([
		getDnsRecords('cloudflare.com', 'TXT', 'cloudflare-dns'),
		getDnsRecords('cloudflare.com', 'TXT', 'google-dns'),
		getDnsRecords('cloudflare.com', 'TXT', 'node-dns'),
	])

	assert.notEqual(txtRecordsWithCloudflareDns.length, 0, 'No TXT records returned')
	assert.equal(txtRecordsWithCloudflareDns.length, txtRecordsWithGoogleDns.length, 'TXT records length between `google-dns` and `cloudflare-dns` doesn\'t match')
	assert.equal(txtRecordsWithGoogleDns.length, txtRecordsWithNodeDns.length, 'TXT records length between `cloudflare-dns` and `node-dns` doesn\'t match')
});

test('get all DNS records for "x.com"', async () => {
	const dnsRecords = await getAllDnsRecords('x.com')

	assert.notEqual(dnsRecords.length, 0, 'No DNS Records returned')
	assert.ok(dnsRecords.find(record => record.type === 'NS'), 'No NS records returned')
	assert.ok(dnsRecords.find(record => record.type === 'A'), 'No A records returned')
	assert.ok(dnsRecords.find(record => record.type === 'MX'), 'No MX records returned')
	assert.ok(dnsRecords.find(record => record.type === 'TXT'), 'No TXT records returned')
});

test('should detect the wildcard subdomains for "wordpress.org"', async () => {
	const dnsRecords = await getAllDnsRecords('wordpress.org')

	const nsRecords = dnsRecords.filter(record => record.type === 'NS')
	const aRecords = dnsRecords.filter(record => record.type === 'A')

	assert.notEqual(nsRecords.length, 0, 'No NS records returned')
	assert.notEqual(aRecords.length, 0, 'No A records returned')
	assert.ok(dnsRecords.find(record => record.name === '*.wordpress.org'), 'Expected *.wordpress.org record not found')
});
