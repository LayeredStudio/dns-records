const dnsRecords = require('./index.js');

(async () => {

	try {
		// Get A DNS records
		const records = await dnsRecords.getDnsRecords('cloudflare.com', 'TXT')
		console.log('DNS TXT records', records)

		// Get NameServers info
		const ns = await dnsRecords.getNameServers('cloudflare.com')
		console.log('NameServers', ns)

		// Discover all DNS records
		const allRecords = await dnsRecords.getAllRecords('x.com')
		console.log('DNS all records', allRecords)
	} catch (err) {
		console.error(err)
	}

})()
