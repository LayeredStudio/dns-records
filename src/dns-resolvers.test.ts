import { strict as assert } from 'node:assert'
import { test, suite } from 'node:test'
import { isIPv4, isIPv6 } from 'node:net'

import { dnsRecordsCloudflare, dnsRecordsGoogle, dnsRecordsNodeDns } from './dns-resolvers.js'

suite('Cloudflare DNS resolver', () => {
	test('NS records', async () => {
		const nsRecords = await dnsRecordsCloudflare('cloudflare.com', 'NS')

		assert.ok(nsRecords.length > 1)
		assert.equal(nsRecords[0].name, 'cloudflare.com')
		assert.equal(nsRecords[0].type, 'NS')
		assert.ok(Number.isSafeInteger(nsRecords[0].ttl))
		assert.ok(nsRecords[0].data.length)
	})

	test('A records', async () => {
		const aRecords = await dnsRecordsCloudflare('cloudflare.com', 'A')

		assert.notEqual(aRecords.length, 0)
		assert.equal(aRecords[0].name, 'cloudflare.com')
		assert.equal(aRecords[0].type, 'A')
		assert.ok(Number.isSafeInteger(aRecords[0].ttl))
		assert.ok(isIPv4(aRecords[0].data))
	})

	test('AAAA records', async () => {
		const aaaaRecords = await dnsRecordsCloudflare('cloudflare.com','AAAA')

		assert.notEqual(aaaaRecords.length, 0)
		assert.equal(aaaaRecords[0].name, 'cloudflare.com')
		assert.equal(aaaaRecords[0].type, 'AAAA')
		assert.ok(Number.isSafeInteger(aaaaRecords[0].ttl))
		assert.ok(isIPv6(aaaaRecords[0].data))
	})

	test('MX records', async () => {
		const mxRecords = await dnsRecordsCloudflare('cloudflare.com', 'MX')

		assert.notEqual(mxRecords.length, 0)
		assert.equal(mxRecords[0].name, 'cloudflare.com')
		assert.equal(mxRecords[0].type, 'MX')
		assert.ok(Number.isSafeInteger(mxRecords[0].ttl))
		assert.ok(mxRecords[0].data)
	})

	test('TXT records', async () => {
		const txtRecords = await dnsRecordsCloudflare('cloudflare.com', 'txt')

		assert.notEqual(txtRecords.length, 0)
		assert.equal(txtRecords[0].name, 'cloudflare.com')
		assert.equal(txtRecords[0].type, 'TXT')
		assert.ok(Number.isSafeInteger(txtRecords[0].ttl))
		assert.ok(txtRecords[0].data)
		assert.ok(txtRecords.some(record => record.data.includes('v=spf1')))
	})

	test('CAA records', async () => {
		const caaRecords = await dnsRecordsCloudflare('cloudflare.com', 'CAA')

		assert.notEqual(caaRecords.length, 0)
		assert.equal(caaRecords[0].name, 'cloudflare.com')
		assert.equal(caaRecords[0].type, 'CAA')
		assert.ok(Number.isSafeInteger(caaRecords[0].ttl))
		assert.ok(caaRecords[0].data)
	})

	test('ANY records', async () => {
		const anyRecords = await dnsRecordsCloudflare('dash.cloudflare.com')

		assert.notEqual(anyRecords.length, 0)
		assert.equal(anyRecords[0].name, 'dash.cloudflare.com')
		assert.equal(anyRecords[0].type, 'A')
		assert.ok(Number.isSafeInteger(anyRecords[0].ttl))
		assert.ok(isIPv4(anyRecords[0].data))
	})
})

suite('Google DNS resolver', () => {
	test('A records', async () => {
		const aRecords = await dnsRecordsGoogle('gmail.com', 'A')

		assert.notEqual(aRecords.length, 0)
		assert.equal(aRecords[0].name, 'gmail.com')
		assert.equal(aRecords[0].type, 'A')
		assert.ok(Number.isSafeInteger(aRecords[0].ttl))
		assert.ok(isIPv4(aRecords[0].data))
	})

	test('AAAA records', async () => {
		const aaaaRecords = await dnsRecordsGoogle('gmail.com', 'AAAA')

		assert.notEqual(aaaaRecords.length, 0)
		assert.equal(aaaaRecords[0].name, 'gmail.com')
		assert.equal(aaaaRecords[0].type, 'AAAA')
		assert.ok(Number.isSafeInteger(aaaaRecords[0].ttl))
		assert.ok(isIPv6(aaaaRecords[0].data))
	})

	test('TXT records', async () => {
		const txtRecords = await dnsRecordsGoogle('gmail.com', 'txt')

		assert.notEqual(txtRecords.length, 0)
		assert.equal(txtRecords[0].name, 'gmail.com')
		assert.equal(txtRecords[0].type, 'TXT')
		assert.ok(Number.isSafeInteger(txtRecords[0].ttl))
		assert.ok(txtRecords[0].data)
	})

	test('CAA records', async () => {
		const caaRecords = await dnsRecordsGoogle('gmail.com', 'CAA')

		assert.notEqual(caaRecords.length, 0)
		assert.equal(caaRecords[0].name, 'gmail.com')
		assert.equal(caaRecords[0].type, 'CAA')
		assert.ok(Number.isSafeInteger(caaRecords[0].ttl))
		assert.ok(caaRecords[0].data)
	})

	test('ANY records', async () => {
		const anyRecords = await dnsRecordsGoogle('mail.google.com')

		assert.notEqual(anyRecords.length, 0)
		assert.equal(anyRecords[0].name, 'mail.google.com')
		assert.equal(anyRecords[0].type, 'A')
		assert.ok(Number.isSafeInteger(anyRecords[0].ttl))
		assert.ok(isIPv4(anyRecords[0].data))
	})
})

suite('Node DNS resolver', () => {
	test('NS records', async () => {
		const nsRecords = await dnsRecordsNodeDns('nodejs.org', 'NS')

		assert.notEqual(nsRecords.length, 0)
		assert.equal(nsRecords[0].name, 'nodejs.org')
		assert.equal(nsRecords[0].type, 'NS')
		assert.ok(Number.isSafeInteger(nsRecords[0].ttl))
		assert.ok(nsRecords[0].data.length)
	})

	test('A records', async () => {
		const aRecords = await dnsRecordsNodeDns('nodejs.org', 'A')

		assert.notEqual(aRecords.length, 0)
		assert.equal(aRecords[0].name, 'nodejs.org')
		assert.equal(aRecords[0].type, 'A')
		assert.ok(Number.isSafeInteger(aRecords[0].ttl))
		assert.ok(isIPv4(aRecords[0].data))
	})

	test('AAAA records', async () => {
		const aaaaRecords = await dnsRecordsNodeDns('nodejs.org', 'AAAA')

		assert.notEqual(aaaaRecords.length, 0)
		assert.equal(aaaaRecords[0].name, 'nodejs.org')
		assert.equal(aaaaRecords[0].type, 'AAAA')
		assert.ok(Number.isSafeInteger(aaaaRecords[0].ttl))
		assert.ok(isIPv6(aaaaRecords[0].data))
	})

	test('TXT records', async () => {
		const txtRecords = await dnsRecordsNodeDns('nodejs.org', 'TXT')

		assert.notEqual(txtRecords.length, 0)
		assert.equal(txtRecords[0].name, 'nodejs.org')
		assert.equal(txtRecords[0].type, 'TXT')
		assert.ok(Number.isSafeInteger(txtRecords[0].ttl))
		assert.ok(txtRecords[0].data)
	})

	test('CAA records', async () => {
		const caaRecords = await dnsRecordsNodeDns('npmjs.com', 'CAA')

		assert.notEqual(caaRecords.length, 0)
		assert.equal(caaRecords[0].name, 'npmjs.com')
		assert.equal(caaRecords[0].type, 'CAA')
		assert.ok(Number.isSafeInteger(caaRecords[0].ttl))
		assert.ok(caaRecords[0].data)
	})

	test('ANY records', async () => {
		const anyRecords = await dnsRecordsNodeDns('docs.npmjs.com')

		assert.notEqual(anyRecords.length, 0)
		assert.equal(anyRecords[0].name, 'docs.npmjs.com')
		assert.equal(anyRecords[0].type, 'CNAME')
		assert.ok(Number.isSafeInteger(anyRecords[0].ttl))
		assert.equal(anyRecords[0].data, 'npm.github.io')
	})
})
