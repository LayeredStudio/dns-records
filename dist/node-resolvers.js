import url from 'node:url';
import { spawnSync } from 'node:child_process';
/**
 * Get DNS records using the `dig` command
 *
 * @param names The name(s) to query
 * @param types The DNS type(s) to query
 * @param server The DNS server to query. If not provided, the default DNS server on the network will be used
 * @returns The DNS records
 */
export async function getDnsRecordsDig(names, types = 'A', server) {
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
        name = url.domainToASCII(name);
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
        let name = String(parts[0]);
        if (name.endsWith('.')) {
            name = name.slice(0, -1);
        }
        dnsRecords.push({
            name,
            ttl: Number(parts[1]),
            type: String(parts[3]),
            data: parts.slice(4).join(" ")
        });
    });
    return dnsRecords;
}
