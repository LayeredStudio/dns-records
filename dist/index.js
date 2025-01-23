import { toASCII } from 'punycode';
import { getDnsRecords } from './get-dns-records.js';
import { subdomainsRecords } from './subdomains.js';
import { isDomain } from './utils.js';
/**
 * Discover all DNS records for a domain name and stream each record as a text line.
 *
 * @param domain Valid domain name.
 * @param options Options for DNS resolver, extra subdomains to check, etc.
 * @returns ReadableStream of DNS records.
 */
export function getAllDnsRecordsStream(domain, options) {
    options = {
        subdomains: [],
        commonSubdomainsCheck: true,
        ...(options || {}),
    };
    if (!isDomain(domain)) {
        throw new Error(`"${domain}" is not a valid domain name`);
    }
    domain = toASCII(domain);
    const encoder = new TextEncoder();
    const { readable, writable } = new TransformStream();
    const writer = writable.getWriter();
    // found records
    const recordsHashes = [];
    // records that can expose subdomains
    const subdomainsChecked = [];
    const subdomainsExtra = [];
    if (options.subdomains) {
        subdomainsExtra.push(...options.subdomains);
    }
    if (options.commonSubdomainsCheck) {
        subdomainsExtra.push(...subdomainsRecords);
    }
    const sendRecord = (record) => {
        const hash = `${record.name}-${record.type}-${record.data}`;
        if (!recordsHashes.includes(hash) && record.name.endsWith(domain)) {
            recordsHashes.push(hash);
            writer.write(encoder.encode([record.name, record.ttl, 'IN', record.type, record.data].join('\t')));
        }
    };
    let runningChecks = 5;
    const sendRecords = (records) => {
        records.forEach(r => sendRecord(r));
        reqDone();
    };
    const reqDone = () => {
        // if we have all the records, check for subdomains
        if (--runningChecks === 0) {
            // check for A,AAAA,CNAME subdomains
            while (subdomainsExtra.length) {
                const subdomain = subdomainsExtra.shift();
                if (subdomain && !subdomainsChecked.includes(subdomain)) {
                    runningChecks++;
                    subdomainsChecked.push(subdomain);
                    getDnsRecords(`${subdomain}.${domain}`, 'A', options.resolver).then(sendRecords);
                }
            }
            //todo check for txt records for subdomains
        }
        if (runningChecks === 0) {
            writer.close();
        }
    };
    const addSubdomain = (value) => {
        value = value.endsWith('.') ? value.slice(0, -1) : value;
        if (value.endsWith(`.${domain}`)) {
            const subdomain = value.replace(`.${domain}`, '');
            if (!subdomainsExtra.includes(subdomain)) {
                subdomainsExtra.push(subdomain);
            }
        }
    };
    // first check - NS records
    getDnsRecords(domain, 'NS', options.resolver).then(nsRecords => {
        if (nsRecords.length) {
            nsRecords.forEach(r => {
                sendRecord(r);
                if (r.data.includes(domain)) {
                    addSubdomain(r.data);
                }
            });
            getDnsRecords(domain, 'SOA', options.resolver).then(sendRecords);
            //getDnsRecords(domain, 'CAA').then(sendRecords)
            getDnsRecords(domain, 'A', options.resolver).then(sendRecords);
            getDnsRecords(domain, 'AAAA', options.resolver).then(sendRecords);
            getDnsRecords(domain, 'MX', options.resolver).then(records => {
                records.forEach(r => {
                    if (r.data.includes(domain)) {
                        const parts = r.data.split(' ');
                        if (parts.length > 1) {
                            addSubdomain(String(parts[1]));
                        }
                    }
                });
                sendRecords(records);
            });
            getDnsRecords(domain, 'TXT', options.resolver).then(records => {
                records.forEach(r => {
                    // extract subdomains from SPF records
                    // https://datatracker.ietf.org/doc/html/rfc7208
                    if (r.data.includes('v=spf1') && r.data.includes(domain)) {
                        r.data.split(' ').forEach(spf => {
                            if (spf.startsWith('include:') && spf.endsWith(domain)) {
                                addSubdomain(spf.replace('include:', ''));
                            }
                            else if (spf.startsWith('a:') && spf.endsWith(domain)) {
                                addSubdomain(spf.replace('a:', ''));
                            }
                            else if (spf.startsWith('mx:') && spf.endsWith(domain)) {
                                addSubdomain(spf.replace('mx:', ''));
                            }
                        });
                    }
                });
                sendRecords(records);
            });
        }
        else {
            writer.close();
        }
    });
    return readable;
}
/**
 * Discover all DNS records for a domain name and return an array of records.
 *
 * @param domain Valid domain name.
 * @param options Options for DNS resolver, extra subdomains to check, etc.
 * @returns Array of all `DnsRecord` discovered for the domain, with wildcard record added.
 *
 * @example Get all DNS records for example.com with best-for-runtime DNS resolver
 * ```js
 * import { getAllDnsRecords } from '@layered/dns-records'
 *
 * const records = await getAllDnsRecords('example.com')
 * ```
 *
 * @example Get all DNS records from `cloudflare-dns` DNS resolver
 * ```js
 * import { getAllDnsRecords } from '@layered/dns-records'
 *
 * const records = await getAllDnsRecords('example.com', {
 *   resolver: 'cloudflare-dns',
 * })
 * ```
 */
export async function getAllDnsRecords(domain, options) {
    const records = [];
    const dnsRecordsStream = getAllDnsRecordsStream(domain, options);
    const reader = dnsRecordsStream.getReader();
    return new Promise((resolve, reject) => {
        const read = () => {
            reader.read().then(({ done, value }) => {
                if (done) {
                    resolve(detectWildcardRecords(domain, records));
                }
                else {
                    records.push(parseDnsRecord(value));
                    read();
                }
            }).catch(reject);
        };
        read();
    });
}
/**
 * Parse a DNS record string into a DnsRecord object.
 *
 * @param record DNS record string.
 * @returns `DnsRecord` object.
 */
export function parseDnsRecord(record) {
    if (record instanceof Uint8Array) {
        record = new TextDecoder().decode(record);
    }
    const parts = record.split('\t');
    if (parts.length < 5 || parts[2] !== 'IN') {
        throw new Error(`Invalid DNS record: ${record}`);
    }
    return {
        name: String(parts[0]),
        ttl: Number(parts[1]),
        type: String(parts[3]),
        data: String(parts[4]),
    };
}
/**
 * Detect wildcard DNS records and return a new array with the wildcard record added.
 *
 * @param domain Domain name.
 * @param records Array of DNS records.
 * @param percent Percentage of records with the same data to consider a wildcard.
 * @returns Array of DNS records with wildcard records grouped as `*.domain`.
 */
export function detectWildcardRecords(domain, records, percent = 0.15) {
    const sameDataGroup = {};
    const wildcardsFound = [];
    records.forEach(record => {
        if (['A', 'AAAA', 'CNAME'].includes(record.type)) {
            const key = `${record.type}-${record.data}`;
            sameDataGroup[key] ||= 0;
            sameDataGroup[key]++;
        }
    });
    const recordsWithWildcard = [];
    records.forEach(record => {
        if (['A', 'AAAA', 'CNAME'].includes(record.type)) {
            const key = `${record.type}-${record.data}`;
            const sameData = sameDataGroup[key] || 0;
            const recordTypeLength = records.filter(r => r.type === record.type).length;
            // ?? make the formula easier to understand, already don't know how it works
            if (sameData / recordTypeLength < percent || recordTypeLength < subdomainsRecords.length / 2) {
                recordsWithWildcard.push(record);
            }
            else if (!wildcardsFound.includes(key)) {
                wildcardsFound.push(key);
                recordsWithWildcard.push({
                    ...record,
                    name: `*.${domain}`,
                });
            }
        }
        else {
            recordsWithWildcard.push(record);
        }
    });
    return recordsWithWildcard;
}
