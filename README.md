# 🌍 DNS Records

**dns-records** is a DNS helper tool for Node.js than can quickly discover and retrieve DNS records for a domain.

Uses `dig` command to make DNS requests, has a built-in list of subdomains to test for and has support for auto-discovering more subdomains based on records found.

## Highlights
* Retrieves really fast DNS records for a domain
* Discovers all A, AAAA and CNAME for a domain
* Provides results in a easy-to-use format

## Roadmap
Aiming to have these features:
- [x] Retrieve DNS records for a domain -> `dnsRecords.getDnsRecords()`
- [x] Discover common subdomains for a domain -> `dnsRecords.getAllRecords()`
- [ ] Test that all NS respond with same info, with extra info: response time, NameServer location & ISP

## Getting Started

#### Requirements

- `dig` command for DNS lookups
- `time` command to measure response times

#### Installation

```npm i @layered/dns-records```

#### Usage
The library has a simple API.
Use `dnsRecords.getAllRecords(query)` to retrieve all DNS records for a domain OR request specific record types with `dnsRecords.getDnsRecords(domain, 'TXT')`

**Get domain TXT Records**
```js
const dnsRecords = require('@layered/dns-records');

(async () => {

	// Get TXT DNS records
	const records = await dnsRecords.getDnsRecords('google.com', 'TXT')
	console.log('DNS TXT records', records)

})()
```
Returns a promise which resolves with an `Array` of records found:
```js
[ { name: 'google.com.',
    ttl: '608',
    type: 'TXT',
    value: '"v=spf1 include:_spf.google.com ~all"' },
  ...
]
```

**Discover all DNS records for a domain**
```js
const dnsRecords = require('./index.js');

(async () => {

	// Discover all DNS records
	const allRecords = await dnsRecords.getAllRecords('x.com')
	console.log('DNS all records', allRecords)

})()
```
Returns a promise which resolves with an `Array` of records found, grouped by type:
```js
{
  NS:
   [ { name: 'x.com.',
       ttl: '3600',
       type: 'NS',
       value: 'ns71.domaincontrol.com.' },
     { name: 'x.com.',
       ttl: '3600',
       type: 'NS',
       value: 'ns72.domaincontrol.com.' } ],
  SOA:
   [ { name: 'x.com.',
       ttl: '600',
       type: 'SOA',
       value:
        'ns71.domaincontrol.com. dns.jomax.net. 2018071100 28800 7200 604800 600' } ],
  CAA: [],
  DNSKEY: [],
  A:
   [ { name: 'x.com.', ttl: '600', type: 'A', value: '160.153.63.10' },
     { name: 'x.com.', ttl: '600', type: 'A', value: '160.153.63.10' } ],
  AAAA: [],
  CNAME:
   [ { name: 'www.x.com.',
       ttl: '3600',
       type: 'CNAME',
       value: 'x.com.' } ],
  MX:
   [ { name: 'x.com.',
       ttl: '3600',
       type: 'MX',
       value: '10 mx-van.mail.am0.yahoodns.net.' } ],
  TXT: []
}
```

**Test NS servers for a domain** - requires `time` command!
```js
const dnsRecords = require('./index.js');

(async () => {

  // Discover NS info
  const NSRecords = await dnsRecords.getNameServers('fb.com')
  console.log('NS servers info', NSRecords)

})()
```
Returns a promise which resolves with an `Array` of NS info:
```js
[
  {
    ns: 'a.ns.facebook.com.',
    soaSerial: '1565080527',
    IPv4: [ '69.171.239.12' ],
    IPv6: [ '2a03:2880:fffe:c:face:b00c::35' ],
    responseTimev4: [ 53 ],
    responseTimev6: [ 75 ]
  },
  {
    ns: 'b.ns.facebook.com.',
    soaSerial: '1565080527',
    IPv4: [ '69.171.255.12' ],
    IPv6: [ '2a03:2880:ffff:c:face:b00c::35' ],
    responseTimev4: [ 57 ],
    responseTimev6: [ 83 ]
  }
]
```

## More

Please report any issues here on GitHub.
[Any contributions are welcome](CONTRIBUTING.md)

## License

[MIT](http://opensource.org/licenses/MIT)

Copyright (c) Andrei Igna, Layered
