import { strict as assert } from 'node:assert';
import { test, suite } from 'node:test';
import { isDomain, isTld } from './utils.js';
suite('isDomain()', () => {
    test('valid domains', () => {
        assert.ok(isDomain('google.com'));
        assert.ok(isDomain('invalid-but-good-format.example'));
        assert.ok(isDomain('dns.cloudflare-dns.com'));
        assert.ok(isDomain('example.example.example.example'));
    });
    test('invalid domains', () => {
        assert.equal(isDomain(''), false);
        assert.equal(isDomain('1'), false);
        assert.equal(isDomain('google'), false);
    });
});
suite('isTld()', () => {
    test('valid TLDs', () => {
        assert.ok(isTld('com'));
        assert.ok(isTld('.com'));
        assert.ok(isTld('.validtldformat'));
    });
    test('invalid TLDs', () => {
        assert.equal(isTld(''), false);
        assert.equal(isTld('c'), false);
        assert.equal(isTld('-'), false);
        assert.equal(isTld('1'), false);
        assert.equal(isTld('.example-tld'), false);
    });
});
