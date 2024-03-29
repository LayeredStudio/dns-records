import { toASCII } from 'punycode';
import { subdomainsRecords } from './subdomains.js';
const isTld = (tld) => {
    if (tld.startsWith('.')) {
        tld = tld.substring(1);
    }
    return /^([a-z]{2,64}|xn[a-z0-9-]{5,})$/i.test(toASCII(tld));
};
const isDomain = (domain) => {
    if (domain.endsWith('.')) {
        domain = domain.substring(0, domain.length - 1);
    }
    const labels = toASCII(domain).split('.').reverse();
    const labelTest = /^([a-z0-9-_]{1,64}|xn[a-z0-9-]{5,})$/i;
    return labels.length > 1 && labels.every((label, index) => {
        return index ? !label.startsWith('-') && !label.endsWith('-') && labelTest.test(label) : isTld(label);
    });
};
const dnsTypeNumbers = {
    1: 'A',
    2: 'NS',
    5: 'CNAME',
    6: 'SOA',
    12: 'PTR',
    15: 'MX',
    16: 'TXT',
    24: 'SIG',
    25: 'KEY',
    28: 'AAAA',
    33: 'SRV',
    257: 'CAA',
};
const dnsResolvers = {
    'cloudflare-dns': async (name, type = 'A') => {
        const re = await fetch(`https://cloudflare-dns.com/dns-query?name=${toASCII(name)}&type=${type}&cd=1`, {
            headers: {
                accept: 'application/dns-json',
            }
        });
        if (!re.ok) {
            throw new Error(`Error fetching DNS records for ${name}: ${re.status} ${re.statusText}`);
        }
        const json = await re.json();
        const records = (json.Answer || []).map((record) => {
            return {
                name: record.name,
                type: dnsTypeNumbers[record.type] || String(record.type),
                ttl: record.TTL,
                data: record.data,
            };
        });
        return records;
    },
    'google-dns': async (name, type = 'A') => {
        const re = await fetch(`https://dns.google/resolve?name=${toASCII(name)}&type=${type}&cd=1`);
        if (!re.ok) {
            throw new Error(`Error fetching DNS records for ${name}: ${re.status} ${re.statusText}`);
        }
        const json = await re.json();
        const records = (json.Answer || []).map((record) => {
            return {
                name: record.name,
                type: dnsTypeNumbers[record.type] || String(record.type),
                ttl: record.TTL,
                data: record.data,
            };
        });
        return records;
    },
};
/**
 * Get DNS records of a given type for a FQDN.
 * @param name Fully qualified domain name.
 * @param type DNS record type: A, AAAA, TXT, CNAME, MX, etc.
 * @param resolver DNS resolver to use. Default: cloudflare-dns.
 */
export async function getDnsRecords(name, type = 'A', resolver = 'cloudflare-dns') {
    if (!isDomain(name)) {
        throw new Error(`"${name}" is not a valid domain name`);
    }
    if (typeof resolver === 'string' && resolver in dnsResolvers) {
        const fn = dnsResolvers[resolver];
        if (typeof fn !== 'function') {
            throw new Error(`Invalid DNS resolver: ${resolver}`);
        }
        return fn(name, type);
    }
    if (typeof resolver === 'function') {
        return resolver(name, type);
    }
    throw new Error(`Invalid DNS resolver: ${resolver}`);
}
/**
 * Discover all DNS records for a given domain and stream each record as a text line.
 * @param domain Valid domain name.
 * @param options Options for DNS resolver, extra subdomains to check, etc.
 */
export function getAllDnsRecordsStream(domain, options = {}) {
    options = {
        resolver: 'cloudflare-dns',
        subdomains: [],
        ...options,
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
    const subdomainsExtra = [...subdomainsRecords];
    if (options.subdomains) {
        subdomainsExtra.unshift(...options.subdomains);
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
            while (subdomainsExtra.length) {
                const subdomain = subdomainsExtra.shift();
                //console.log('sub', subdomain, !subdomainsChecked.includes(subdomain))
                if (subdomain && !subdomainsChecked.includes(subdomain)) {
                    runningChecks++;
                    subdomainsChecked.push(subdomain);
                    getDnsRecords(`${subdomain}.${domain}`, 'A', options.resolver).then(sendRecords);
                }
            }
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
                    if (r.data.includes('v=spf1') && r.data.includes(domain)) {
                        r.data.split(' ').forEach(spf => {
                            if (spf.startsWith('include:') && spf.endsWith(domain)) {
                                addSubdomain(spf.replace('include:', ''));
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
 * Discover all DNS records for a given domain and return an array of records.
 * @param domain Valid domain name.
 * @param options Options for DNS resolver, extra subdomains to check, etc.
 */
export async function getAllDnsRecords(domain, options = {}) {
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
 * @param record DNS record string.
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
 * Detect wildcard DNS records and return a new array with the wildcard records added.
 * @param domain Domain name.
 * @param records Array of DNS records.
 * @param percent Percentage of records with the same data to consider a wildcard.
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
