// Unless explicitly stated otherwise all files in this repository are licensed under the Apache 2.0 License.
// This product includes software developed at Datadog (https://www.datadoghq.com/) Copyright 2023 Datadog, Inc.

// Source rotation and bot-giveaway helpers used by the scraping attack.

// Residential-looking source networks (RFC 5737 test ranges plus arbitrary octets).
const IP_PREFIXES = [
    '203.0.113',
    '198.51.100',
    '192.0.2',
    '104.28.14',
    '24.86.11',
    '71.202.44',
];

// Datacenter / cloud networks keyed by real ASN, modelled as /16 prefixes.
// Mirrored by the fallback table in tracing/bot-signals.js; keep them in sync.
const DATACENTER_RANGES = [
    { prefix: '165.227', asn: 14061, org: 'DigitalOcean, LLC' },
    { prefix: '45.79',   asn: 63949, org: 'Akamai/Linode' },
    { prefix: '51.75',   asn: 16276, org: 'OVH SAS' },
    { prefix: '88.198',  asn: 24940, org: 'Hetzner Online GmbH' },
    { prefix: '3.120',   asn: 16509, org: 'Amazon AWS' },
    { prefix: '34.90',   asn: 396982, org: 'Google Cloud' },
];

// Residential-looking source networks flagged as anonymized infrastructure
// (residential proxy / Tor / scanner). These are not hosting ASNs, so they are
// the "blind spot" that a datacenter-IP check alone misses. The target-side
// preload flags them via bot.signal.anon_proxy; in production this is Datadog
// Threat Intelligence (@threat_intel.results.category).
const ANON_PROXY_RANGES = [
    { prefix: '203.0.113',  category: 'residential_proxy' },
    { prefix: '198.51.100', category: 'tor' },
    { prefix: '192.0.2',    category: 'scanner' },
];

// Paths a scraper probes but a human browsing the shop never would.
const RECON_PATHS = [
    '/robots.txt',
    '/sitemap.xml',
    '/.well-known/security.txt',
    '/.git/config',
    '/admin',
];

const BROWSER_USER_AGENTS = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:125.0) Gecko/20100101 Firefox/125.0',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1',
    'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36',
];

function randInt(max) {
    return Math.floor(Math.random() * max);
}

function pick(arr) {
    return arr[randInt(arr.length)];
}

function randomIp() {
    return pick(IP_PREFIXES) + '.' + (randInt(254) + 1);
}

function randomUserAgent() {
    return pick(BROWSER_USER_AGENTS);
}

function datacenterIp(range) {
    return range.prefix + '.' + randInt(256) + '.' + (randInt(254) + 1);
}

function forwardHeaders(ip, headers = {}) {
    return Object.assign({}, headers, {
        'User-Agent': randomUserAgent(),
        'X-Forwarded-For': ip,
        'X-Real-IP': ip,
        'Forwarded': 'for=' + ip,
    });
}

function spoofedSourceHeaders(headers = {}) {
    return forwardHeaders(randomIp(), headers);
}

function datacenterSourceHeaders(headers = {}) {
    const range = pick(DATACENTER_RANGES);
    return { headers: forwardHeaders(datacenterIp(range), headers), range };
}

// One fixed provider, so a burst forms a cluster of distinct IPs sharing an ASN.
function clusteredSourceHeaders(range, headers = {}) {
    return forwardHeaders(datacenterIp(range), headers);
}

// A single fixed IP, for behavior that must come from one source (e.g. a
// read-only scraper that views many pages and never converts).
function fixedSourceHeaders(ip, headers = {}) {
    return forwardHeaders(ip, headers);
}

// A source drawn from anonymized-infrastructure ranges (residential proxy / Tor
// / scanner). Not a hosting ASN, so it evades the datacenter-IP check. The
// prefixes are /24 (three octets), so only the final octet is randomized.
function anonProxySourceHeaders(headers = {}) {
    const range = pick(ANON_PROXY_RANGES);
    const ip = range.prefix + '.' + (randInt(254) + 1);
    return { headers: forwardHeaders(ip, headers), range };
}

module.exports = {
    IP_PREFIXES,
    DATACENTER_RANGES,
    ANON_PROXY_RANGES,
    RECON_PATHS,
    BROWSER_USER_AGENTS,
    randomIp,
    randomUserAgent,
    spoofedSourceHeaders,
    datacenterSourceHeaders,
    clusteredSourceHeaders,
    fixedSourceHeaders,
    anonProxySourceHeaders,
};
