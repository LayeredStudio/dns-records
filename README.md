# 🌍 DNS Records

**@layered/dns-records** is a DNS helper library for JavaScript than can quickly discover and retrieve all DNS records for a domain.

Uses Cloudflare or Google DNS, has a built-in list of subdomains to test for and support for auto-discovering more subdomains based on records found.

→ See it in action here https://dmns.app

## Highlights
* Retrieves really fast DNS records for a domain
* Discovers all A, AAAA and CNAME for a domain
* Option to specify extra subdomains to check for
* Provides results in a easy-to-use format
* Works in all JS runtimes: NodeJS (uses `dig`), CloudFlare Workers, Browsers, Deno, etc

## Roadmap
Aiming to have these features:
- [x] Retrieve DNS records for a domain -> `getDnsRecords(name: string, type: string = 'A')`
- [x] Discover common subdomains for a domain -> `getAllDnsRecords(domain: string)`
- [ ] NS test: all Name Servers are synchronised and reply with same data
- [ ] NS extra info: response time, NS IP location & ISP

## v2 breaking changes
- ESM only
- `getAllRecords()` renamed to `getAllDnsRecords()`
- `getNameServers` is removed, use `getDnsRecords(name: string, type = 'NS')`

## Getting Started

#### Requirements

- `dig` command for DNS lookups, if using `node-dig` as resolver. https://linux.die.net/man/1/dig
- `fetch` as a global

#### Installation

```npm i @layered/dns-records```

#### Usage
The library has a simple API.
Use `getAllDnsRecords(query)` to retrieve all DNS records for a domain OR request specific record types with `getDnsRecords(domain, 'TXT')`

#### Example
```js
import { getDnsRecords, getAllDnsRecords } from '@layered/dns-records'

const txtRecords = await getDnsRecords('google.com', 'TXT')
const allRecords = await getAllDnsRecords('x.com')
```

## Client API
- [`getDnsRecords(name, type)`](#dns-records-by-type) - Get DNS records for a hostname
- [`getAllRecords(hostname)`](#all-dns-records) - Get ALL DNS records for a domain

#### DNS Records by type

`getDnsRecords(name: string, type: string = 'A'): Promise<DnsRecord[]>`

|Params|type|default|description|
|-----|---|---|---|
|name |string|   |hostname. Ex: `'x.com'`|
|type |string|`A`|record type: Ex: `'TXT'`, `'MX'`, `'CNAME'`|

```js
import { getDnsRecords } from '@layered/dns-records'

const records1 = await getDnsRecords('google.com')
console.log('DNS A records', records1)

const records2 = await getDnsRecords('google.com', 'TXT')
console.log('DNS TXT records', records2)
```
Returns a promise which resolves with an `DnsRecord[]` of records found:
```js
[ { name: 'google.com.',
    ttl: 608,
    type: 'TXT',
    value: '"v=spf1 include:_spf.google.com ~all"' },
  ...
]
```


#### All DNS records

`getAllDnsRecords(domain: string, options): Promise<DnsRecord[]>`

|Params|type|default|description|
|-----|---|---|---|
|domain|string|   |Domain name, ex: `'google.com'`|

```js
import { getAllRecords } from '@layered/dns-records'

const allRecords = await getAllRecords('x.com')
console.log('DNS all records', allRecords)
```
Returns a Promise which resolves with `DnsRecord[]` of records found:
```js
  [ { name: 'x.com.',
      ttl: 3600,
      type: 'NS',
      value: 'ns71.domaincontrol.com.' },
    { name: 'x.com.',
      ttl: 3600,
      type: 'NS',
      value: 'ns72.domaincontrol.com.' },
    { name: 'x.com.',
      ttl: 600,
      type: 'SOA',
      value:
      'ns71.domaincontrol.com. dns.jomax.net. 2018071100 28800 7200 604800 600' },
    { name: 'x.com.', ttl: 600, type: 'A', value: '160.153.63.10' },
    { name: 'x.com.', ttl: 600, type: 'A', value: '160.153.63.10' },
    { name: 'www.x.com.',
      ttl: 3600,
      type: 'CNAME',
      value: 'x.com.' },
    { name: 'x.com.',
      ttl: 3600,
      type: 'MX',
      value: '10 mx-van.mail.am0.yahoodns.net.' }
  ]
```

## More

Please report any issues here on GitHub.
[Any contributions are welcome](CONTRIBUTING.md)

## License

[MIT](http://opensource.org/licenses/MIT)

Copyright (c) Andrei Igna, Layered
