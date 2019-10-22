const assert = require('assert')
const dnsRecords = require('../index.js')

describe('#dnsRecords.getNameServers()', function() {
	it('should return 4 NameServers for "google.com"', async function() {
		const expectedNs = ['ns1.google.com.', 'ns2.google.com.', 'ns3.google.com.', 'ns4.google.com.']
		const ns = await dnsRecords.getNameServers('google.com')
		assert.equal(ns.length, 4, 'Number of NameServers doesn\'t match')
		assert(expectedNs.includes(ns[0].ns), 'Returned NS doesn\'t match')
		assert(expectedNs.includes(ns[1].ns), 'Returned NS doesn\'t match')
	});
});

describe('#dnsRecords.getDnsRecords()', function() {
	it('should return TXT records for "cloudflare.com"', async function() {
		const txt = await dnsRecords.getDnsRecords('cloudflare.com')
		assert(txt.length > 0, 'No TXT records returned')
	});

	it('should return TXT records for "blog.google"', async function() {
		const txt = await dnsRecords.getDnsRecords('blog.google')
		assert(txt.length > 0, 'No TXT records returned')
	});
});

describe('#dnsRecords.getAllRecords()', function() {
	it('should return all DNS records for "x.com"', async function() {
		const records = await dnsRecords.getAllRecords('x.com')
		assert(records.A.length > 0, 'No A records returned')
		assert(records.NS.length > 0, 'No NS records returned')
		assert(records.CNAME.length > 0, 'No CNAME records returned')
		assert(records.MX.length > 0, 'No MX records returned')
	});

	it('should detect the wildcard subdomains for "wordpress.org"', async function() {
		const records = await dnsRecords.getAllRecords('wordpress.org')
		const as = records.A.map(record => record.name)
		const cnames = records.CNAME.map(record => record.name)

		assert(records.A.length > 0, 'No A records returned')
		assert(records.NS.length > 0, 'No NS records returned')
		assert(as.includes('*.wordpress.org'), 'No * record found for A')
		assert(cnames.includes('*.wordpress.org'), 'No * record found for CNAME')
	});
});
