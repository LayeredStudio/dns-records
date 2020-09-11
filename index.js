const punycode = require('punycode')
const util = require('util')
const exec = util.promisify(require('child_process').exec)
const crypto = require('crypto')

// Records to check
const subdomainsToCheck = require('./subdomains.js')
let txtToCheck = [
	'_amazonses',
	'_dmarc',
	'_domainkey',
	'default._domainkey',
	'google._domainkey',
	'mail._domainkey',
	'default._bimi',
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
	// +cdflag		// no DNSSEC check, faster
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


const getDnsTime = async (name, server) => {

	if (server && !server.startsWith('@')) {
		server = `@${server}`
	}

	// +noall'		// don't display any texts (authority, question, stats, etc) in response,
	// +stats		// except the stats
	// https://linux.die.net/man/1/dig
	const cmd = `/usr/bin/time -p dig ${server} ${name} +noall +stats`
	let re

	try {
		re = await exec(cmd)
	} catch (err) {
		return null
	}

	let queryTime = re.stdout
					.split("\n")
					.filter(line => line.includes('time: '))
					.map(line => line.split(': '))
					.pop().pop()
					.replace(' msec', '')

	let realTime = re.stderr
					.split("\n")
					.filter(line => line.includes('real'))
					.map(line => line.split("real"))
					.pop().pop()

	return realTime * 1000 - queryTime
}


const getNameServers = async domain => {
	let ns = []

	if (!isDomain(domain)) {
		throw new Error(`"${domain}" is not a valid domain name`)
	}

	const nameServers = await getDnsRecords(domain, 'NS')

	if (!nameServers.length) {
		throw new Error(`No name servers found for "${domain}"`)
	}

	nameServers.forEach(nameServer => {
		ns.push({
			ns:				nameServer.value,
			soaSerial:		'',
			IPv4:			[],
			IPv6:			[],
			responseTimev4:	[],
			responseTimev6:	[]
		})
	})


	// get SOA Record 
	const SOA = await Promise.all(ns.map(nameServer => getDnsRecords(domain, 'SOA', nameServer.ns)))
	SOA.forEach((records, index) => {
		const soaRecord = records[0].value.split(' ')
		ns[index].soaSerial = soaRecord[2]
	})


	// get A/AAAA Records
	const ips = []
	const A = await Promise.all(ns.map(nameServer => getDnsRecords(nameServer.ns, ['A', 'AAAA'])))
	A.forEach((records, index) => {
		records.forEach(record => {
			const ip = record.type === 'A' ? 'IPv4' : 'IPv6'
			ns[index][ip].push(record.value)
			ips.push(record.value)
		})
	})


	// Get NS IPs response time
	const times = await Promise.all(ips.map(ip => getDnsTime(domain, ip)))

	ns = ns.map(record => {

		record.IPv4.forEach(ip => {
			record.responseTimev4.push(times[ips.indexOf(ip)])
		})

		record.IPv6.forEach(ip => {
			record.responseTimev6.push(times[ips.indexOf(ip)])
		})

		return record
	})


	return ns
}


const getAllRecords = async domain => {
	let wildcardSubdomains = []
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


	// filter DNS results to only allow those for requested domain
	const cleanResults = result => {
		return isDomain(result.name) 												// is valid domain
				&& result.name.endsWith(`${domain}.`) 								// is for requested domain
				&& !wildcardSubdomains.includes(result.type + '-' + result.value) 	// is not a match for wildcard CNAME
	}


	// attempt to get all DNS records by AXFR request
	// LE: AXFR fails for some popular NS servers, and is disabled for the moment
	//let records = await getDnsRecords(domain, 'AXFR', nameServers[0].value)
	let records = []

	// attempt to get ANY DNS records
	if (!records.length) {

		try {
			records = await getDnsRecords(domain, 'ANY', nameServers[0].value)
			records = records.filter(record => record.type !== 'HINFO')
		} catch (err) {
			// ANY query failed, carry on with other checks
			console.warn(err.message)
		}

		// if no ANY records, request basic record types
		if (!records.length) {
			records = await getDnsRecords(domain, ['A', 'AAAA', 'MX', 'SOA', 'TXT', 'CAA', 'DNSKEY'], nameServers[0].value)
			records.push(...nameServers)
		}

		//console.timeLog('dnsAll', 'got main records')

		// check subdomains. DNS request type is A, but returns CNAME in case if exists
		let checked = subdomainsToCheck.map(subdomain => `${subdomain}.${domain}`)
		let subdomains = await getDnsRecords(checked, 'A', nameServers[0].value)
		subdomains = subdomains.filter(cleanResults)


		// if there's more records found than asked for, domain most likely has wildcard subdomain
		if (subdomains.length > subdomainsToCheck.length * 0.9) {
			let groups = {}

			subdomains.forEach(subdomain => {
				const groupKey = `${subdomain.type}-${subdomain.value}`
				groups[groupKey] = groups[groupKey] || 0
				groups[groupKey]++
			})

			const found = []
			Object.keys(groups).forEach(group => {
				if (groups[group] > subdomainsToCheck.length * 0.9) {
					found.push(group)
				}
			})

			subdomains.forEach(subdomain => {
				if (!found.includes(subdomain.type + '-' + subdomain.value)) {
					records.push(subdomain)
				} else if (!wildcardSubdomains.includes(subdomain.type + '-' + subdomain.value)) {
					records.push({
						name:	`*.${domain}`,
						ttl:	subdomain.ttl,
						type:	subdomain.type,
						value:	subdomain.value
					})
					wildcardSubdomains.push(subdomain.type + '-' + subdomain.value)
				}
			})
		} else {
			records.push(...subdomains)
		}


		// Check if new subdomains can be extracted from a DNS Record's value
		let extraSubdomains = []
		const extractNewSubdomains = subdomain => {
			let s = subdomain.type === 'MX' ? subdomain.value.split(' ').pop() : subdomain.value

			if (s.endsWith('.')) {
				s = s.slice(0, -1)
			}

			if (isDomain(s) && s.endsWith(`.${domain}`) && !checked.includes(s)) {
				let subdomainParts = s.replace(`.${domain}`, '').split('.')

				// if a sub sub domain is found, example abc.def.example.com,
				// extract all subdomain levels like def.example.com, abc.def.example.com
				while (subdomainParts.length) {
					extraSubdomains.push(`${subdomainParts.join('.')}.${domain}`)
					checked.push(`${subdomainParts.join('.')}.${domain}`)
					subdomainParts.shift()
				}
			}
		}

		// -- In NS records, ex: ns-X.[domain]. Resolve 'ns-X.[domain]'
		nameServers.forEach(extractNewSubdomains)

		// -- In subdomains, ex found: mail CNAME email-server.[domain]. Resolve 'email-server.[domain]'
		subdomains.forEach(extractNewSubdomains)

		// -- In MX records. ex found: '10 incoming.[domain]'. Resolve 'incoming.[domain]'
		records.filter(r => r.type === 'MX').forEach(extractNewSubdomains)

		// -- In TXT spf record, if self referenced domain
		records.filter(r => r.type === 'TXT' && r.value.includes('spf')).forEach(record => {
			let parts = record.value.split(' ')

			// get all parts that include subdomain + domain
			parts = parts.filter(p => (p.startsWith('include:') || p.startsWith('redirect=')) && p.endsWith(`.${domain}`))

			// strip unnecessary strings
			parts = parts.map(p => p.replace('include:', '').replace('redirect=', '').replace(`.${domain}`, ''))

			txtToCheck.push(...parts)
		})


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
		const recordHash = crypto.createHash('md5').update(`${record.name}-${record.type}-${record.value}`).digest('hex')

		if (!added.includes(recordHash)) {
			dns[record.type] = dns[record.type] || []
			dns[record.type].push(record)
			added.push(recordHash)
		}
	})

	return dns
}


module.exports = {
	getDnsRecords,
	getNameServers,
	getAllRecords
}
