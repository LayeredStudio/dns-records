import { strict as assert } from 'node:assert'
import test from 'node:test'
import { isIPv4 } from 'node:net'

import { dnsRecordsCloudflare, dnsRecordsGoogle } from '../src/dns-resolvers.ts'

test('Cloudflare DNS resolver - A', async () => {
	const aRecords = await dnsRecordsCloudflare('cloudflare.com', 'A')

	assert.notEqual(aRecords.length, 0)

	assert.equal(aRecords[0].name, 'cloudflare.com')
	assert.equal(aRecords[0].type, 'A')
	assert.ok(Number.isSafeInteger(aRecords[0].ttl))
	assert.ok(isIPv4(aRecords[0].data))
})

test('Cloudflare DNS resolver - TXT', async () => {
	const txtRecords = await dnsRecordsCloudflare('cloudflare.com', 'txt')

	assert.notEqual(txtRecords.length, 0)

	assert.equal(txtRecords[0].name, 'cloudflare.com')
	assert.equal(txtRecords[0].type, 'TXT')
	assert.ok(Number.isSafeInteger(txtRecords[0].ttl))
	assert.ok(txtRecords[0].data)
})

test('Google DNS resolver - A', async () => {
	const aRecords = await dnsRecordsGoogle('google.com', 'A')

	console.log(aRecords)

	assert.notEqual(aRecords.length, 0)

	assert.equal(aRecords[0].name, 'google.com')
	assert.equal(aRecords[0].type, 'A')
	assert.ok(Number.isSafeInteger(aRecords[0].ttl))
	assert.ok(isIPv4(aRecords[0].data))
})

test('Google DNS resolver - TXT', async () => {
	const txtRecords = await dnsRecordsGoogle('google.com', 'txt')

	assert.notEqual(txtRecords.length, 0)

	assert.equal(txtRecords[0].name, 'google.com')
	assert.equal(txtRecords[0].type, 'TXT')
	assert.ok(Number.isSafeInteger(txtRecords[0].ttl))
	assert.ok(txtRecords[0].data)
})
