// Unless explicitly stated otherwise all files in this repository are licensed under the Apache 2.0 License.
// This product includes software developed at Datadog (https://www.datadoghq.com/) Copyright 2023 Datadog, Inc.

// dd-trace preload for the Juice Shop target (injected via NODE_OPTIONS=--require).
// Inspects each inbound request and tags the request span with bot/scraper
// giveaway signals so Datadog custom rules and AAP can detect attack #12.

function loadTracer() {
    try {
        return require('dd-trace');
    } catch (e) {
        return require('/juice-shop/node_modules/dd-trace');
    }
}

let tracer = null;

// Patch Server emit before dd-trace initializes. dd-trace wraps emit when the
// app requires 'http' (after init), so patching first makes it the outer wrapper:
// it activates the request span, then calls ours, so scope().active() is the live span.
const http = require('http');
const https = require('https');
for (const mod of [http, https]) {
    const origEmit = mod.Server.prototype.emit;
    mod.Server.prototype.emit = function (type, req, res) {
        if (type === 'request' && tracer) {
            try {
                const span = tracer.scope().active();
                if (span) tagBotSignals(span, req, res);
            } catch (e) {
                if (process.env.DD_TRACE_DEBUG) {
                    console.error('[bot-signals] emit hook error:', e && e.message);
                }
            }
        }
        return origEmit.apply(this, arguments);
    };
}

tracer = loadTracer();
tracer.init();

// IP -> ASN via a MaxMind-format database (DB-IP ASN Lite or GeoLite2-ASN).
// Falls back to a small /16 prefix table when the database or module is absent.
const nodePath = require('path');
const ASN_DB_PATH = nodePath.join(__dirname, 'data', 'dbip-asn-lite.mmdb');

let asnReader = null;
try {
    const fs = require('fs');
    const maxmind = require('maxmind');
    asnReader = new maxmind.Reader(fs.readFileSync(ASN_DB_PATH));
    console.log('[bot-signals] ASN database loaded:', ASN_DB_PATH);
} catch (e) {
    console.log('[bot-signals] ASN database unavailable (' + (e && e.code || e && e.message)
        + '); falling back to built-in prefix table. Run tracing/fetch-asn-db.sh to enable it.');
}

// Hosting / cloud / VPS ASNs. An ASN database resolves every IP, so this set
// separates datacenter sources from residential ISPs.
const HOSTING_ASNS = new Set([
    16509, 14618,          // Amazon AWS
    15169, 396982, 19527,  // Google / GCP
    8075, 8068,            // Microsoft Azure
    14061,                 // DigitalOcean
    63949, 20940,          // Akamai / Linode
    16276,                 // OVH
    24940,                 // Hetzner
    20473,                 // Vultr / Choopa
    13335,                 // Cloudflare
    16265, 60781, 30633,   // Leaseweb
    51167,                 // Contabo
    45102, 37963,          // Alibaba Cloud
    46606, 26496,          // Unified Layer / GoDaddy
    9009,                  // M247
]);

const DATACENTER_BY_PREFIX = {
    '165.227': { asn: 14061, org: 'DigitalOcean, LLC' },
    '45.79':   { asn: 63949, org: 'Akamai/Linode' },
    '51.75':   { asn: 16276, org: 'OVH SAS' },
    '88.198':  { asn: 24940, org: 'Hetzner Online GmbH' },
    '3.120':   { asn: 16509, org: 'Amazon AWS' },
    '34.90':   { asn: 396982, org: 'Google Cloud' },
};

const RECON_PATHS = new Set([
    '/robots.txt',
    '/sitemap.xml',
    '/.well-known/security.txt',
    '/.git/config',
    '/admin',
]);

const RATE_WINDOW_MS = 10000;
const RATE_THRESHOLD = 15;      // requests / window from one IP
const CLUSTER_THRESHOLD = 8;    // distinct IPs from one ASN / window

const ipHits = new Map();       // ip -> timestamps[]
const asnIps = new Map();       // asn -> Map<ip, lastSeenTs>

function clientIpFrom(req) {
    const xff = req.headers['x-forwarded-for'];
    if (xff) return xff.split(',')[0].trim();
    if (req.headers['x-real-ip']) return req.headers['x-real-ip'].trim();
    const fwd = req.headers['forwarded'];
    if (fwd) {
        const m = /for=([^;,]+)/i.exec(fwd);
        if (m) return m[1].replace(/["\[\]]/g, '').trim();
    }
    return (req.socket && req.socket.remoteAddress) || 'unknown';
}

function lookupAsn(ip) {
    if (asnReader) {
        const rec = asnReader.get(ip);
        if (rec && rec.autonomous_system_number) {
            const asn = rec.autonomous_system_number;
            return {
                asn,
                org: rec.autonomous_system_organization || 'AS' + asn,
                isHosting: HOSTING_ASNS.has(asn),
            };
        }
        return null;
    }
    const parts = ip.split('.');
    if (parts.length < 2) return null;
    const hit = DATACENTER_BY_PREFIX[parts[0] + '.' + parts[1]];
    return hit ? { asn: hit.asn, org: hit.org, isHosting: true } : null;
}

function recordRate(ip, now) {
    let hits = ipHits.get(ip);
    if (!hits) { hits = []; ipHits.set(ip, hits); }
    hits.push(now);
    while (hits.length && now - hits[0] > RATE_WINDOW_MS) hits.shift();
    return hits.length;
}

function recordAsnCluster(asn, ip, now) {
    let ips = asnIps.get(asn);
    if (!ips) { ips = new Map(); asnIps.set(asn, ips); }
    ips.set(ip, now);
    for (const [k, ts] of ips) {
        if (now - ts > RATE_WINDOW_MS) ips.delete(k);
    }
    return ips.size;
}

function normalizePath(url) {
    if (!url) return '/';
    const q = url.indexOf('?');
    return q === -1 ? url : url.slice(0, q);
}

function tagBotSignals(span, req, res) {
    try {
        const now = Date.now();
        const ip = clientIpFrom(req);
        const path = normalizePath(req.url);

        let score = 0;

        if (RECON_PATHS.has(path)) {
            span.setTag('bot.signal.recon_path', true);
            span.setTag('bot.recon.path', path);
            score++;
        }

        const geo = lookupAsn(ip);
        if (geo) {
            span.setTag('network.client.asn', geo.asn);
            span.setTag('network.client.asn_org', geo.org);

            if (geo.isHosting) {
                span.setTag('bot.signal.datacenter_ip', true);
                score++;

                const asnIpCount = recordAsnCluster(geo.asn, ip, now);
                span.setTag('bot.client.asn_ip_count', asnIpCount);
                if (asnIpCount >= CLUSTER_THRESHOLD) {
                    span.setTag('bot.signal.asn_cluster', true);
                    score++;
                }
            }
        }

        const rate = recordRate(ip, now);
        span.setTag('bot.client.request_rate', rate);
        if (rate >= RATE_THRESHOLD) {
            span.setTag('bot.signal.high_request_rate', true);
            score++;
        }

        span.setTag('bot.score', score);

        if (score >= 2 && tracer.appsec && typeof tracer.appsec.trackCustomEvent === 'function') {
            tracer.appsec.trackCustomEvent('business_logic.scraping', {
                'client.ip': String(ip),
                'client.asn': geo ? String(geo.asn) : 'unknown',
                'request.path': String(path),
                'bot.score': String(score),
            });
        }
    } catch (e) {
        if (process.env.DD_TRACE_DEBUG) {
            console.error('[bot-signals] tagging error:', e && e.message);
        }
    }
}

console.log('[bot-signals] inbound bot-signal tagging enabled');
