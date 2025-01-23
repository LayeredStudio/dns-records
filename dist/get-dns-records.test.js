import { strict as assert } from 'node:assert';
import { test, suite } from 'node:test';
import { getDnsRecords } from './get-dns-records.js';
import { isIPv4 } from 'node:net';
suite('NS for google.com', async () => {
    const expectedNs = ['ns1.google.com', 'ns2.google.com', 'ns3.google.com', 'ns4.google.com'];
    const [nsRecordsWithCloudflareDns, nsRecordsWithGoogleDns, nsRecordsWithNodeDns, nsRecordsWithNodeDig] = await Promise.all([
        getDnsRecords('google.com', 'NS', 'cloudflare-dns'),
        getDnsRecords('google.com', 'NS', 'google-dns'),
        getDnsRecords('google.com', 'NS', 'node-dns'),
        getDnsRecords('google.com', 'NS', 'node-dig'),
    ]);
    test('same number of NS from all resolvers', () => {
        assert.equal(nsRecordsWithCloudflareDns.length, expectedNs.length, 'Number of NameServers doesn\'t match');
        assert.equal(nsRecordsWithGoogleDns.length, expectedNs.length, 'Number of NameServers doesn\'t match');
        assert.equal(nsRecordsWithNodeDns.length, expectedNs.length, 'Number of NameServers doesn\'t match');
        assert.equal(nsRecordsWithNodeDig.length, expectedNs.length, 'Number of NameServers doesn\'t match');
    });
    test('validate NS from `cloudflare-dns`', () => {
        assert.equal(nsRecordsWithCloudflareDns[0].name, 'google.com', 'Returned NS doesn\'t match');
        assert.equal(nsRecordsWithCloudflareDns[0].type, 'NS', 'Returned record type is not NS');
        assert.ok(expectedNs.some(ns => ns === nsRecordsWithCloudflareDns[0].data), 'Returned NS doesn\'t match');
        assert.ok(expectedNs.some(ns => ns === nsRecordsWithCloudflareDns[1].data), 'Returned NS doesn\'t match');
    });
    test('validate NS from `google-dns`', () => {
        assert.equal(nsRecordsWithGoogleDns[0].name, 'google.com', 'Returned NS doesn\'t match');
        assert.equal(nsRecordsWithGoogleDns[0].type, 'NS', 'Returned record type is not NS');
        assert.ok(expectedNs.some(ns => ns === nsRecordsWithGoogleDns[0].data), 'Returned NS doesn\'t match');
        assert.ok(expectedNs.some(ns => ns === nsRecordsWithGoogleDns[1].data), 'Returned NS doesn\'t match');
    });
    test('validate NS from `node-dns`', () => {
        assert.equal(nsRecordsWithNodeDns[0].name, 'google.com', 'Returned NS doesn\'t match');
        assert.equal(nsRecordsWithNodeDns[0].type, 'NS', 'Returned record type is not NS');
        assert.ok(expectedNs.some(ns => ns === nsRecordsWithNodeDns[0].data), 'Returned NS doesn\'t match');
        assert.ok(expectedNs.some(ns => ns === nsRecordsWithNodeDns[1].data), 'Returned NS doesn\'t match');
    });
    test('validate NS from `node-dig`', () => {
        assert.equal(nsRecordsWithNodeDig[0].name, 'google.com', 'Returned NS doesn\'t match');
        assert.equal(nsRecordsWithNodeDig[0].type, 'NS', 'Returned record type is not NS');
        assert.ok(expectedNs.some(ns => ns === nsRecordsWithNodeDig[0].data), 'Returned NS doesn\'t match');
        assert.ok(expectedNs.some(ns => ns === nsRecordsWithNodeDig[1].data), 'Returned NS doesn\'t match');
    });
});
suite('A records for "mañana.com" (IDN)', async () => {
    const [aRecordsWithCloudflareDns, aRecordsWithGoogleDns, aRecordsWithNodeDns, aRecordsWithNodeDig] = await Promise.all([
        getDnsRecords('mañana.com', 'A', 'cloudflare-dns'),
        getDnsRecords('mañana.com', 'A', 'google-dns'),
        getDnsRecords('mañana.com', 'A', 'node-dns'),
        getDnsRecords('mañana.com', 'A', 'node-dig'),
    ]);
    test('validate length of records', () => {
        assert.notEqual(aRecordsWithCloudflareDns.length, 0);
        assert.equal(aRecordsWithCloudflareDns.length, aRecordsWithGoogleDns.length);
        assert.equal(aRecordsWithGoogleDns.length, aRecordsWithNodeDns.length);
        assert.equal(aRecordsWithNodeDns.length, aRecordsWithNodeDig.length);
    });
    test('validate returned data', () => {
        assert.ok(isIPv4(aRecordsWithCloudflareDns[0].data));
        assert.equal(aRecordsWithCloudflareDns[0].data, aRecordsWithGoogleDns[0].data);
        assert.equal(aRecordsWithGoogleDns[0].data, aRecordsWithNodeDns[0].data);
        assert.equal(aRecordsWithNodeDns[0].data, aRecordsWithNodeDig[0].data);
    });
});
suite('TXT records for "cloudflare.com"', async () => {
    const [txtRecordsWithCloudflareDns, txtRecordsWithGoogleDns, txtRecordsWithNodeDns, txtRecordsWithNodeDig] = await Promise.all([
        getDnsRecords('cloudflare.com', 'TXT', 'cloudflare-dns'),
        getDnsRecords('cloudflare.com', 'TXT', 'google-dns'),
        getDnsRecords('cloudflare.com', 'TXT', 'node-dns'),
        getDnsRecords('cloudflare.com', 'TXT', 'node-dig'),
    ]);
    test('validate number of records', () => {
        assert.notEqual(txtRecordsWithCloudflareDns.length, 0);
        assert.equal(txtRecordsWithCloudflareDns.length, txtRecordsWithGoogleDns.length, 'TXT records length between `google-dns` and `cloudflare-dns` doesn\'t match');
        assert.equal(txtRecordsWithGoogleDns.length, txtRecordsWithNodeDns.length, 'TXT records length between `cloudflare-dns` and `node-dns` doesn\'t match');
        assert.equal(txtRecordsWithNodeDns.length, txtRecordsWithNodeDig.length);
    });
    test('find spf record (cloudflare.com must have one)', () => {
        assert.ok(txtRecordsWithCloudflareDns.some(record => record.data.includes('v=spf1')));
        assert.ok(txtRecordsWithGoogleDns.some(record => record.data.includes('v=spf1')));
        assert.ok(txtRecordsWithNodeDns.some(record => record.data.includes('v=spf1')));
        assert.ok(txtRecordsWithNodeDig.some(record => record.data.includes('v=spf1')));
    });
});
