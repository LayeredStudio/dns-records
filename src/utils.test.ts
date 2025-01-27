import { strict as assert } from 'node:assert'
import { test, suite } from 'node:test'

import { validatedDomain } from './utils.js'

suite('validatedDomain()', () => {
	test('invalid domains', () => {
		assert.throws(() => validatedDomain(''))
		assert.throws(() => validatedDomain('1'))
		assert.throws(() => validatedDomain('4.4.4.4'))
		assert.throws(() => validatedDomain('google'))
		assert.throws(() => validatedDomain('domain.'))
		assert.throws(() => validatedDomain('domain.-'))
		assert.throws(() => validatedDomain('domain.c'))
		assert.throws(() => validatedDomain('domain.1'))
		assert.throws(() => validatedDomain('domain.-com'))
		assert.throws(() => validatedDomain('domain.-com'))
		assert.throws(() => validatedDomain('looks like a domain .com'))
		assert.throws(() => validatedDomain('example.example-tld'))
		assert.throws(() => validatedDomain('-example.net'))
		assert.throws(() => validatedDomain('example-.net'))
		assert.throws(() => validatedDomain('-example-.example.us'))
		assert.throws(() => validatedDomain('http://example.com'))
		assert.throws(() => validatedDomain('http://example.com/'))
	})

	test('valid domains', () => {
		assert.equal(validatedDomain('google.com'), 'google.com')
		assert.equal(validatedDomain('google.co.uk'), 'google.co.uk')
		assert.equal(validatedDomain('EXAMPLE.NET'), 'example.net')
		assert.equal(validatedDomain('domain.com.'), 'domain.com')
		assert.equal(validatedDomain('invalid-but-good-format.example'), 'invalid-but-good-format.example')
		assert.equal(validatedDomain('dns.cloudflare-dns.com'), 'dns.cloudflare-dns.com')
		assert.equal(validatedDomain('example.EXAMPLE.example.example'), 'example.example.example.example')
	})

	test('valid domains - IDN', () => {
		assert.equal(validatedDomain('español.com'), 'xn--espaol-zwa.com')
		assert.equal(validatedDomain('xn--espaol-zwa.com'), 'xn--espaol-zwa.com')
		assert.equal(validatedDomain('MAÑANA.COM'), 'xn--maana-pta.com')
		assert.equal(validatedDomain('example.テスト'), 'example.xn--zckzah')
	})
})
