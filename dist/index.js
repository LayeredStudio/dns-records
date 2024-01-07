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
    const labelTest = /^([a-z0-9-]{1,64}|xn[a-z0-9-]{5,})$/i;
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
export async function getDnsRecords(name, type = 'A', resolver = 'cloudflare-dns') {
    if (!isDomain(name)) {
        throw new Error(`"${name}" is not a valid domain name`);
    }
    if (['cloudflare-dns', 'google-dns'].includes(resolver)) {
        const url = resolver === 'cloudflare-dns' ? 'https://cloudflare-dns.com/dns-query' : 'https://dns.google/resolve';
        const re = await fetch(`${url}?name=${toASCII(name)}&type=${type}&cd=1`, {
            headers: {
                accept: 'application/dns-json',
            }
        });
        if (re.ok) {
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
        }
        else {
            throw new Error(`Error fetching DNS records for ${name}: ${re.status} ${re.statusText}`);
        }
    }
    else if (resolver === 'node-dig') {
        return getDnsRecordsDig(name, type);
    }
    return [];
}
/**
 * Get DNS records using the `dig` command
 */
export async function getDnsRecordsDig(names, types = 'A', server) {
    const { spawnSync } = await import('node:child_process');
    // start building the arguments list for the `dig` command
    const args = [];
    // append @ to server if not present
    if (server) {
        if (!server.startsWith('@')) {
            server = `@${server}`;
        }
        args.push(server);
    }
    if (!Array.isArray(names)) {
        names = [names];
    }
    names.forEach(name => {
        name = toASCII(name);
        if (Array.isArray(types) && types.length) {
            types.forEach(type => {
                args.push(name, type);
            });
        }
        else if (types && typeof types === 'string') {
            args.push(name, types);
        }
        else {
            args.push(name);
        }
    });
    // +noall'		// don't display any texts (authority, question, stats, etc) in response,
    // +answer		// except the answer
    // +cdflag		// no DNSSEC check, faster
    // https://linux.die.net/man/1/dig
    const dig = spawnSync('dig', [...args, '+noall', '+answer', '+cdflag']);
    let re = dig.stdout.toString();
    const dnsRecords = [];
    // split lines & ignore comments or empty
    re.split("\n")
        .filter(line => line.length && !line.startsWith(';'))
        .forEach(line => {
        // replace tab(s) with space, then split by space
        const parts = line.replace(/[\t]+/g, " ").split(" ");
        dnsRecords.push({
            name: String(parts[0]),
            ttl: Number(parts[1]),
            type: String(parts[3]),
            data: parts.slice(4).join(" ")
        });
    });
    return dnsRecords;
}
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
                    getDnsRecords(`${subdomain}.${domain}`, 'A').then(sendRecords);
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
            getDnsRecords(domain, 'SOA').then(sendRecords);
            //getDnsRecords(domain, 'CAA').then(sendRecords)
            getDnsRecords(domain, 'A').then(sendRecords);
            getDnsRecords(domain, 'AAAA').then(sendRecords);
            getDnsRecords(domain, 'MX').then(records => {
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
            getDnsRecords(domain, 'TXT').then(records => {
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
export async function getAllDnsRecords(domain, options = {}) {
    const records = [];
    const dnsRecordsStream = getAllDnsRecordsStream(domain, options);
    const reader = dnsRecordsStream.getReader();
    return new Promise((resolve) => {
        const read = () => {
            reader.read().then(({ done, value }) => {
                if (done) {
                    //todo detect wildcards
                    resolve(records);
                }
                else {
                    records.push(parseDnsRecord(value));
                    read();
                }
            }).catch(error => {
                console.error('dns err', error);
            });
        };
        read();
    });
}
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
