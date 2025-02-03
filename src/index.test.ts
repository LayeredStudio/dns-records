import { strict as assert } from 'node:assert'
import { test, suite } from 'node:test'

import { getAllDnsRecords } from './index.js'

suite('Get all DNS records for "x.com"', async () => {
	const [ dnsRecordsWithNodeDns, dnsRecordsWithCloudflareDns, dnsRecordsWithGoogleDns, dnsRecordsWithNodeDig ] = await Promise.all([
		getAllDnsRecords('x.com'),
		getAllDnsRecords('x.com', { resolver: 'cloudflare-dns' }),
		getAllDnsRecords('x.com', { resolver: 'google-dns' }),
		getAllDnsRecords('x.com', { resolver: 'node-dig' }),
	])

	test('validate NS records', () => {
		const nsRecordsWithNodeDns = dnsRecordsWithNodeDns.filter(record => record.type === 'NS')
		const nsRecordsWithCloudflareDns = dnsRecordsWithCloudflareDns.filter(record => record.type === 'NS')
		const nsRecordsWithGoogleDns = dnsRecordsWithGoogleDns.filter(record => record.type === 'NS')
		const nsRecordsWithNodeDig = dnsRecordsWithNodeDig.filter(record => record.type === 'NS')

		assert.notEqual(nsRecordsWithNodeDns.length, 0, 'No NS Records returned')
		assert.equal(nsRecordsWithNodeDns.length, nsRecordsWithNodeDig.length, 'NS records count differs between "node-dns" and "node-dig"')
		assert.equal(nsRecordsWithNodeDns.length, nsRecordsWithCloudflareDns.length, 'NS records count differs between "node-dns" and "cloudflare-dns"')
		assert.equal(nsRecordsWithCloudflareDns.length, nsRecordsWithGoogleDns.length, 'NS records count differs between "cloudflare-dns" and "google-dns"')
	})

	test('validate MX records', () => {
		const mxRecordsWithNodeDns = dnsRecordsWithNodeDns.filter(record => record.type === 'MX')
		const mxRecordsWithCloudflareDns = dnsRecordsWithCloudflareDns.filter(record => record.type === 'MX')
		const mxRecordsWithGoogleDns = dnsRecordsWithGoogleDns.filter(record => record.type === 'MX')
		const mxRecordsWithNodeDig = dnsRecordsWithNodeDig.filter(record => record.type === 'MX')

		assert.notEqual(mxRecordsWithNodeDns.length, 0, 'No MX Records returned')
		assert.equal(mxRecordsWithNodeDns.length, mxRecordsWithCloudflareDns.length, 'MX records count differs between "node-dns" and "cloudflare-dns"')
		assert.equal(mxRecordsWithNodeDns.length, mxRecordsWithNodeDig.length, 'MX records count differs between "node-dns" and "node-dig"')
		assert.equal(mxRecordsWithCloudflareDns.length, mxRecordsWithGoogleDns.length, 'MX records count differs between "cloudflare-dns" and "google-dns"')
	})

	test('validate TXT records', () => {
		const txtRecordsWithNodeDns = dnsRecordsWithNodeDns.filter(record => record.type === 'TXT')
		const txtRecordsWithCloudflareDns = dnsRecordsWithCloudflareDns.filter(record => record.type === 'TXT')
		const txtRecordsWithGoogleDns = dnsRecordsWithGoogleDns.filter(record => record.type === 'TXT')
		const txtRecordsWithNodeDig = dnsRecordsWithNodeDig.filter(record => record.type === 'TXT')

		assert.notEqual(txtRecordsWithNodeDns.length, 0, 'No TXT Records returned')
		assert.equal(txtRecordsWithNodeDns.length, txtRecordsWithNodeDig.length, 'TXT records count differs between "node-dns" and "node-dig"')
		assert.equal(txtRecordsWithNodeDns.length, txtRecordsWithCloudflareDns.length, 'TXT records count differs between "node-dns" and "cloudflare-dns"')
		assert.equal(txtRecordsWithCloudflareDns.length, txtRecordsWithGoogleDns.length, 'TXT records count differs between "cloudflare-dns" and "google-dns"')
		assert.ok(txtRecordsWithNodeDns.some(record => record.data.includes('v=spf1')), 'spf TXT record not found')
	})

	test('validate A records', { todo: true }, () => {
		const aRecordsWithNodeDns = dnsRecordsWithNodeDns.filter(record => record.type === 'A')
		const aRecordsWithCloudflareDns = dnsRecordsWithCloudflareDns.filter(record => record.type === 'A')
		const aRecordsWithGoogleDns = dnsRecordsWithGoogleDns.filter(record => record.type === 'A')
		const aRecordsWithNodeDig = dnsRecordsWithNodeDig.filter(record => record.type === 'A')

		assert.notEqual(aRecordsWithNodeDns.length, 0, 'No A Records returned with `node-dns`')
		assert.notEqual(aRecordsWithCloudflareDns.length, 0, 'No A Records returned with `cloudflare-dns`')
		assert.notEqual(aRecordsWithNodeDns.length, 0, 'No A Records returned with `google-dns`')
		assert.notEqual(aRecordsWithCloudflareDns.length, 0, 'No A Records returned with `node-dig`')

		const aNamesWithNodeDns = new Set(aRecordsWithNodeDns.map(record => record.name))
		const aNamesWithCloudflareDns = new Set(aRecordsWithCloudflareDns.map(record => record.name))
		const aNamesWithGoogleDns = new Set(aRecordsWithGoogleDns.map(record => record.name))
		const aNamesWithNodeDig = new Set(aRecordsWithNodeDig.map(record => record.name))
		assert.equal(aNamesWithNodeDns.size, aNamesWithCloudflareDns.size, 'A names differ between `node-dns` and `cloudflare-dns`')
		assert.equal(aNamesWithCloudflareDns.size, aNamesWithGoogleDns.size, 'A names differ between `cloudflare-dns` and `google-dns`')
		assert.equal(aNamesWithGoogleDns.size, aNamesWithNodeDig.size, 'A names differ between `google-dns` and `node-dig`')
	})

	test('validate CNAME records', () => {
		const cnameRecordsWithNodeDns = dnsRecordsWithNodeDns.filter(record => record.type === 'CNAME')
		const cnameRecordsWithCloudflareDns = dnsRecordsWithCloudflareDns.filter(record => record.type === 'CNAME')
		const cnameRecordsWithGoogleDns = dnsRecordsWithGoogleDns.filter(record => record.type === 'CNAME')
		const cnameRecordsWithNodeDig = dnsRecordsWithNodeDig.filter(record => record.type === 'CNAME')

		assert.notEqual(cnameRecordsWithNodeDns.length, 0, 'No CNAME Records returned with `node-dns`')
		assert.equal(cnameRecordsWithNodeDns.length, cnameRecordsWithCloudflareDns.length, 'CNAME Records different between `node-dns` and `cloudflare-dns`')
		assert.equal(cnameRecordsWithCloudflareDns.length, cnameRecordsWithGoogleDns.length, 'CNAME Records different between `cloudflare-dns` and `google-dns`')
		assert.equal(cnameRecordsWithGoogleDns.length, cnameRecordsWithNodeDig.length, 'CNAME Records different between `google-dns` and `node-dig`')
	})
})

test('should detect the wildcard subdomains for "wordpress.org"', async () => {
	const dnsRecords = await getAllDnsRecords('wordpress.org')

	const nsRecords = dnsRecords.filter(record => record.type === 'NS')
	const aRecords = dnsRecords.filter(record => record.type === 'A')

	assert.notEqual(nsRecords.length, 0, 'No NS records returned')
	assert.notEqual(aRecords.length, 0, 'No A records returned')
	assert.ok(dnsRecords.find(record => record.name === '*.wordpress.org'), 'Expected *.wordpress.org record not found')
});
