const punycode = require('punycode')
const util = require('util')
const exec = util.promisify(require('child_process').exec)
const crypto = require('crypto')

// Records to check
const subdomainsToCheck = require('./subdomains.js')
const txtToCheck = [
	'_amazonses',
	'_dmarc',
	'_domainkey',
	'default._domainkey',
	'google._domainkey',
]


const isTld = tld => {
	if (tld.startsWith('.')) {
		tld = tld.substring(1)
	}

	return /^([a-z]{2,64}|xn[a-z0-9-]{5,})$/i.test(punycode.toASCII(tld))
}

const isDomain = domain => {
	if (domain.endsWith('.')) {
		domain = domain.substring(0, domain.length - 1)
	}

	const labels = punycode.toASCII(domain).split('.').reverse()
	const labelTest = /^([a-z0-9-]{1,64}|xn[a-z0-9-]{5,})$/i

	return labels.length > 1 && labels.every((label, index) => {
		return index ? !label.startsWith('-') && !label.endsWith('-') && labelTest.test(label) : isTld(label)
	})
}


const getDnsRecords = async (names, types, server) => {
	let cmd = ['dig']

	if (!Array.isArray(types)) {
		types = [types] || ['A']
	}

	if (!Array.isArray(names)) {
		names = [names]
	}

	if (server && !server.startsWith('@')) {
		server = `@${server}`
	}

	// +noall'		// don't display any texts (authority, question, stats, etc) in response,
	// +answer		// except the answer
	// +cdflag		// no DNSSEC check
	// https://linux.die.net/man/1/dig

	names.forEach(name => {
		types.forEach(type => {
			cmd.push(server, name, type, '+noall +answer +cdflag')
		})
	})

	let re = await exec(cmd.join(' '))

	// This step catches errors sent with `stderr` and not sent with `throw`
	if (re.stderr) {
		throw new Error(re.stderr)
	}

	// split lines & ignore comments or empty
	re = re.stdout.split("\n").filter(line => line.length && !line.startsWith(';'))

	// process lines
	re = re.map(line => {
		// replace tab(s) with space		split by space
		line = line.replace(/[\t]+/g, " ").split(" ")

		return {
			name:	line[0],
			ttl:	line[1],
			type:	line[3],
			value:	line.slice(4).join(" ")
		}
	})

	return re
}

const getAllRecords = async domain => {
	let dns = {
		NS:		[],
		SOA:	[],
		CAA:	[],
		DNSKEY:	[],
		A:		[],
		AAAA:	[],
		CNAME:	[],
		MX:		[],
		TXT:	[]
	}

	//console.time('dnsAll')

	if (!isDomain(domain)) {
		throw new Error(`"${domain}" is not a valid domain name`)
	}

	const nameServers = await getDnsRecords(domain, 'NS')

	if (!nameServers.length) {
		throw new Error(`No name servers found for "${domain}"`)
	}

	// attempt to get all DNS records by AXFR request
	// LE: AXFR fails for some popular NS servers, and is disabled for the moment
	//let records = await getDnsRecords(domain, 'AXFR', nameServers[0].value)
	let records = []

	// attempt to get ANY DNS records
	if (!records.length) {
		records = await getDnsRecords(domain, 'ANY', nameServers[0].value)
		records = records.filter(record => record.type !== 'HINFO')

		// if no ANY records, request basic record types
		if (!records.length) {
			records = await getDnsRecords(domain, ['A', 'AAAA', 'MX', 'SOA', 'TXT', 'CAA', 'DNSKEY'], nameServers[0].value)
			records.push(...nameServers)
		}

		//console.timeLog('dnsAll', 'got main records')

		// filter found DNS results to only those for requested domain
		const cleanResults = result => isDomain(result.name) && result.name.endsWith(`.${domain}.`)


		// check subdomains. DNS request type is A, but returns CNAME in case if exists
		let checked = subdomainsToCheck.map(subdomain => `${subdomain}.${domain}.`)
		let subdomains = await getDnsRecords(checked, 'A', nameServers[0].value)
		records.push(...subdomains.filter(cleanResults))


		// check if new subdomains were discovered
		let extraSubdomains = []
		const extractNewSubdomains = subdomain => {
			if (isDomain(subdomain.value) && subdomain.value.endsWith(`.${domain}.`) && !checked.includes(subdomain.value)) {
				extraSubdomains.push(subdomain.value)
				checked.push(subdomain.value)
			}
		}


		// check extra subdomains
		nameServers.forEach(extractNewSubdomains)
		subdomains.forEach(extractNewSubdomains)

		while (extraSubdomains.length) {
			subdomains = await getDnsRecords(extraSubdomains, 'A', nameServers[0].value)
			records.push(...subdomains.filter(cleanResults))

			extraSubdomains = []
			subdomains.forEach(extractNewSubdomains)
		}


		// TODO get AAAA based on A results


		// get TXT for subdomains info
		const txts = await getDnsRecords(txtToCheck.map(subdomain => subdomain + '.' + domain), 'TXT', nameServers[0].value)
		records.push(...txts)
	}

	//console.timeEnd('dnsAll')

	const added = []

	records.forEach(record => {
		if (!dns[record.type]) {
			dns[record.type] = []
		}

		const recordHash = crypto.createHash('md5').update(`${record.name}-${record.type}-${record.value}`).digest('hex')

		if (!added.includes(recordHash)) {
			dns[record.type].push(record)
			added.push(recordHash)
		}
	})

	return dns
}


module.exports = {
	getDnsRecords,
	getAllRecords
}
