import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { getAllDnsRecords } from './index.js';
test('get all DNS records for "x.com"', async () => {
    const dnsRecords = await getAllDnsRecords('x.com');
    assert.notEqual(dnsRecords.length, 0, 'No DNS Records returned');
    assert.ok(dnsRecords.find(record => record.type === 'NS'), 'No NS records returned');
    assert.ok(dnsRecords.find(record => record.type === 'A'), 'No A records returned');
    assert.ok(dnsRecords.find(record => record.type === 'MX'), 'No MX records returned');
    assert.ok(dnsRecords.find(record => record.type === 'TXT'), 'No TXT records returned');
});
test('should detect the wildcard subdomains for "wordpress.org"', async () => {
    const dnsRecords = await getAllDnsRecords('wordpress.org');
    const nsRecords = dnsRecords.filter(record => record.type === 'NS');
    const aRecords = dnsRecords.filter(record => record.type === 'A');
    assert.notEqual(nsRecords.length, 0, 'No NS records returned');
    assert.notEqual(aRecords.length, 0, 'No A records returned');
    assert.ok(dnsRecords.find(record => record.name === '*.wordpress.org'), 'Expected *.wordpress.org record not found');
});
