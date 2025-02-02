import { strict as assert } from 'node:assert'
import { test, suite } from 'node:test'
import { isIPv4, isIPv6 } from 'node:net'

import { dnsRecordsCloudflare, dnsRecordsGoogle, dnsRecordsNodeDig, dnsRecordsNodeDns } from './dns-resolvers.js'

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
		const nsRecords = await dnsRecordsNodeDns('domains-api.com', 'NS')

		assert.equal(nsRecords.length, 2)
		assert.equal(nsRecords[0].name, 'domains-api.com')
		assert.equal(nsRecords[0].type, 'NS')
		assert.ok(Number.isSafeInteger(nsRecords[0].ttl))

		// Check if the NS records are the expected ones
		const expectedNsRecords = ['nitin.ns.cloudflare.com', 'robin.ns.cloudflare.com']
		assert.ok(expectedNsRecords.includes(nsRecords[0].data))
		assert.ok(expectedNsRecords.includes(nsRecords[1].data))
	})

	test('A records', async () => {
		const aRecords = await dnsRecordsNodeDns('domains-api.com', 'A')

		assert.notEqual(aRecords.length, 0)
		assert.equal(aRecords[0].name, 'domains-api.com')
		assert.equal(aRecords[0].type, 'A')
		assert.ok(Number.isSafeInteger(aRecords[0].ttl))
		assert.ok(isIPv4(aRecords[0].data))
	})

	test('AAAA records', async () => {
		const aaaaRecords = await dnsRecordsNodeDns('domains-api.com', 'AAAA')

		assert.notEqual(aaaaRecords.length, 0)
		assert.equal(aaaaRecords[0].name, 'domains-api.com')
		assert.equal(aaaaRecords[0].type, 'AAAA')
		assert.ok(Number.isSafeInteger(aaaaRecords[0].ttl))
		assert.ok(isIPv6(aaaaRecords[0].data))
	})

	test('TXT records', async () => {
		const txtRecords = await dnsRecordsNodeDns('domains-api.com', 'TXT')

		assert.notEqual(txtRecords.length, 0)
		assert.equal(txtRecords[0].name, 'domains-api.com')
		assert.equal(txtRecords[0].type, 'TXT')
		assert.ok(Number.isSafeInteger(txtRecords[0].ttl))

		const testTxtRecord = txtRecords.find(record => record.data.includes('test-value'))
		assert.ok(testTxtRecord)
	})

	test('ANY records', { todo: true }, async () => {
		const anyRecords = await dnsRecordsNodeDns('cname-test.domains-api.com')

		assert.notEqual(anyRecords.length, 0)
		assert.equal(anyRecords[0].name, 'cname-test.domains-api.com')
		assert.equal(anyRecords[0].type, 'CNAME')
		assert.ok(Number.isSafeInteger(anyRecords[0].ttl))
		assert.equal(anyRecords[0].data, 'dmns.app')
	})
})

suite('`$ dig` resolver', () => {
	test('NS records', async () => {
		const nsRecords = await dnsRecordsNodeDig('dmns.app', 'NS')

		const expectedNsRecords = ['nitin.ns.cloudflare.com', 'robin.ns.cloudflare.com']

		assert.equal(nsRecords.length, 2)
		assert.equal(nsRecords[0].name, 'dmns.app')
		assert.equal(nsRecords[0].type, 'NS')
		assert.ok(Number.isSafeInteger(nsRecords[0].ttl))
		assert.ok(expectedNsRecords.includes(nsRecords[0].data))
		assert.ok(expectedNsRecords.includes(nsRecords[1].data))
	})

	test('A records', async () => {
		const aRecords = await dnsRecordsNodeDig('dmns.app', 'A')

		assert.notEqual(aRecords.length, 0)
		assert.equal(aRecords[0].name, 'dmns.app')
		assert.equal(aRecords[0].type, 'A')
		assert.ok(Number.isSafeInteger(aRecords[0].ttl))
		assert.ok(isIPv4(aRecords[0].data))
	})

	test('AAAA records', async () => {
		const aaaaRecords = await dnsRecordsNodeDig('dmns.app', 'AAAA')

		assert.notEqual(aaaaRecords.length, 0)
		assert.equal(aaaaRecords[0].name, 'dmns.app')
		assert.equal(aaaaRecords[0].type, 'AAAA')
		assert.ok(Number.isSafeInteger(aaaaRecords[0].ttl))
		assert.ok(isIPv6(aaaaRecords[0].data))
	})

	test('TXT records', async () => {
		const txtRecords = await dnsRecordsNodeDig('dmns.app', 'TXT')

		assert.notEqual(txtRecords.length, 0)
		assert.equal(txtRecords[0].name, 'dmns.app')
		assert.equal(txtRecords[0].type, 'TXT')
		assert.ok(Number.isSafeInteger(txtRecords[0].ttl))
		assert.ok(txtRecords[0].data)

		const spfRecord = txtRecords.find(record => record.data.includes('v=spf1'))
		assert.ok(spfRecord)
	})

	test('ANY records', async () => {
		const anyRecords = await dnsRecordsNodeDig('pm-bounces.dmns.app')

		assert.notEqual(anyRecords.length, 0)

		// One of the records should be an CNAME record
		const anyCnameRecord = anyRecords.find(record => record.type === 'CNAME')
		assert.ok(anyCnameRecord)
		assert.equal(anyCnameRecord.name, 'pm-bounces.dmns.app')
		assert.equal(anyCnameRecord.type, 'CNAME')
		assert.ok(Number.isSafeInteger(anyCnameRecord.ttl))
		assert.equal(anyCnameRecord.data, 'pm.mtasv.net')
	})
})
