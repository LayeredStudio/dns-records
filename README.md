# 🌍 DNS Records

**@layered/dns-records** is a DNS helper library than can quickly discover and retrieve all DNS records for a domain.

Uses Cloudflare or Google DNS, has a built-in list of subdomains to test for and support for auto-discovering more subdomains.

→ See it in action here https://dmns.app

## Highlights
* Retrieves DNS records for a domain
* Discovers (almost) all A, AAAA, CNAME, and TXT for a domain
* Detects wildcard `*` records
* Option to specify extra subdomains to check for
* Provides results in common format, see `DnsRecord`
* Works in all JavaScript runtimes: Browsers, NodeJS, CloudFlare Workers, Deno, Bun, etc

## Getting Started

#### Requirements

- `fetch` as a global
- `dig` command for DNS lookups, if using `node-dig` resolver. https://linux.die.net/man/1/dig

#### Installation

```npm i @layered/dns-records```

#### Usage
The library has a simple API.
Use `getAllDnsRecords(domain)` to retrieve all DNS records for a domain OR request specific record types with `getDnsRecords(hostname, 'TXT')`

#### Example
```js
import { getDnsRecords, getAllDnsRecords } from '@layered/dns-records'

const txtRecords = await getDnsRecords('google.com', 'TXT')
const allRecords = await getAllDnsRecords('x.com')
```

## Client API
- [`getDnsRecords(hostname: string, type: string = 'A', resolver = 'cloudflare-dns')`](#dns-records-by-type) - Get DNS records for a hostname
- [`getAllDnsRecords(domain: string, options)`](#all-dns-records) - Get all DNS records for a domain
- [`getAllDnsRecordsStream(domain: string, options): ReadableStream`](#all-dns-records-stream)

#### DNS Records by type

`getDnsRecords(name: string, type: string = 'A', resolver = 'cloudflare-dns'): Promise<DnsRecord[]>`

|Params|type|default|description|
|-----|---|---|---|
|name |string|   |hostname. Ex: `'x.com'` or `email.apple.com`|
|type |string|`A`|record type: Ex: `'TXT'`, `'MX'`, `'CNAME'`|
|resolver |string|`cloudflare-dns`|DNS resolver to use: `cloudflare-dns`, `google-dns`, `node-dig`|


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
    data: '"v=spf1 include:_spf.google.com ~all"' },
  ...
]
```


#### All DNS records

`getAllDnsRecords(domain: string, options): Promise<DnsRecord[]>`

|Params|type|default|description|
|-----|---|---|---|
|domain|string|   |Valid domain name, ex: `'google.com'`|
|options|object|   |   |

```js
import { getAllDnsRecords } from '@layered/dns-records'

const allRecords = await getAllDnsRecords('x.com')
console.log('DNS all records', allRecords)
```
Returns a Promise which resolves with `DnsRecord[]` of records found:
```js
[ { name: 'x.com.', ttl: 3600, type: 'NS', data: 'ns71.domaincontrol.com.' },
  { name: 'x.com.', ttl: 3600, type: 'NS', data: 'ns72.domaincontrol.com.' },
  { name: 'x.com.', ttl: 600, type: 'SOA', data: 'ns71.domaincontrol.com. dns.jomax.net. 2018071100 28800 7200 604800 600' },
  { name: 'x.com.', ttl: 600, type: 'A', data: '160.153.63.10' },
  { name: 'x.com.', ttl: 600, type: 'A', data: '160.153.63.10' },
  { name: 'www.x.com.',  ttl: 3600, type: 'CNAME', data: 'x.com.' },
  { name: 'x.com.', ttl: 3600, type: 'MX', data: '10 mx-van.mail.am0.yahoodns.net.' }
]
```

## More

Please report any issues here on GitHub.
[Any contributions are welcome](CONTRIBUTING.md)

## License

[MIT](http://opensource.org/licenses/MIT)

Copyright (c) Andrei Igna, Layered
