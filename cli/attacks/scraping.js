// Unless explicitly stated otherwise all files in this repository are licensed under the Apache 2.0 License.
// This product includes software developed at Datadog (https://www.datadoghq.com/) Copyright 2023 Datadog, Inc.

const ora = require('ora');
const chalk = require('chalk');
const logSymbols = require('log-symbols');
const { http } = require('../lib/request');
const {
    datacenterSourceHeaders,
    clusteredSourceHeaders,
    fixedSourceHeaders,
    anonProxySourceHeaders,
    DATACENTER_RANGES,
    RECON_PATHS,
} = require('../lib/rotation');

const PAGE_SIZE = 5;
const PAGES = 40;
const BURST_REQUESTS = 25;
const CLUSTER_REQUESTS = 20;
const STEALTH_VIEWS = 14;   // catalog views from one proxy IP, paced under the rate limit
const PROXY_REQUESTS = 12;  // rotating anonymized-infra sources

async function distributedScrape(targetURL) {

    const stats = {
        reconRequests: 0,
        pageRequests: 0,
        searchRequests: 0,
        burstRequests: 0,
        clusterRequests: 0,
        productsHarvested: 0,
        sourceIps: new Set(),
        userAgents: new Set(),
        datacenterIps: new Set(),
        stealthViews: 0,
        proxyRequests: 0,
        proxyIps: new Set(),
        stealthIp: null,
        searchTerms: [],
        reconPaths: [],
        clusterAsn: null,
        errors: 0,
        endpoints: new Set(),
    };

    // Phase 1: recon path probing
    let spinner = ora('Phase 1/6: probing recon paths').start();
    for (const path of RECON_PATHS) {
        const { headers, range } = datacenterSourceHeaders();
        const config = { method: 'GET', url: targetURL + path, headers };
        stats.reconRequests++;
        stats.reconPaths.push(path);
        stats.sourceIps.add(headers['X-Forwarded-For']);
        stats.datacenterIps.add(headers['X-Forwarded-For']);
        stats.userAgents.add(headers['User-Agent']);
        stats.endpoints.add(path);
        spinner.text = `Phase 1/6: probing ${path} from ${headers['X-Forwarded-For']} (${range.org})`;
        await http().custom(config);
        await new Promise(r => setTimeout(r, 120));
    }
    spinner.stopAndPersist({ symbol: logSymbols.success, text: 'Phase 1/6: recon paths probed' });

    // Phase 2: paginated catalog scrape from datacenter IPs
    spinner = ora('Phase 2/6: paginated catalog scrape').start();
    for (let page = 0; page < PAGES; page++) {
        const offset = page * PAGE_SIZE;
        const { headers } = datacenterSourceHeaders();
        const config = {
            method: 'GET',
            url: targetURL + '/api/Products',
            params: { limit: PAGE_SIZE, offset },
            headers,
        };
        stats.pageRequests++;
        stats.sourceIps.add(headers['X-Forwarded-For']);
        stats.datacenterIps.add(headers['X-Forwarded-For']);
        stats.userAgents.add(headers['User-Agent']);
        stats.endpoints.add('/api/Products');
        spinner.text = `Phase 2/6: page ${page + 1}/${PAGES} (offset ${offset}) from ${headers['X-Forwarded-For']}`;
        const res = await http().custom(config);
        const rows = res && res.data && res.data.data;
        if (Array.isArray(rows)) stats.productsHarvested += rows.length;
        else if (!res || res.status >= 400 || res.isAxiosError) stats.errors++;
        await new Promise(r => setTimeout(r, 120 + Math.floor(Math.random() * 120)));
    }
    const terms = ['apple', 'juice', 'banana', 'cherry', 'lemon', 'melon', 'berry', 'orange'];
    for (const term of terms) {
        const { headers } = datacenterSourceHeaders();
        const config = { method: 'GET', url: targetURL + '/rest/products/search', params: { q: term }, headers };
        stats.searchRequests++;
        stats.searchTerms.push(term);
        stats.sourceIps.add(headers['X-Forwarded-For']);
        stats.datacenterIps.add(headers['X-Forwarded-For']);
        stats.userAgents.add(headers['User-Agent']);
        stats.endpoints.add('/rest/products/search');
        spinner.text = `Phase 2/6: search "${term}" from ${headers['X-Forwarded-For']}`;
        const res = await http().custom(config);
        if (!res || res.status >= 400 || res.isAxiosError) stats.errors++;
        await new Promise(r => setTimeout(r, 120));
    }
    spinner.stopAndPersist({ symbol: logSymbols.success, text: 'Phase 2/6: catalog scraped from datacenter IPs' });

    // Phase 3: high-rate burst from a single IP, no delay
    spinner = ora('Phase 3/6: high-rate burst').start();
    const burstHeaders = clusteredSourceHeaders(DATACENTER_RANGES[0]);
    const burstIp = burstHeaders['X-Forwarded-For'];
    for (let i = 0; i < BURST_REQUESTS; i++) {
        const config = {
            method: 'GET',
            url: targetURL + '/api/Products',
            params: { limit: PAGE_SIZE, offset: (i % PAGES) * PAGE_SIZE },
            headers: burstHeaders,
        };
        stats.burstRequests++;
        stats.sourceIps.add(burstIp);
        stats.datacenterIps.add(burstIp);
        stats.endpoints.add('/api/Products');
        spinner.text = `Phase 3/6: burst ${i + 1}/${BURST_REQUESTS} from ${burstIp} (no delay)`;
        const res = await http().custom(config);
        if (!res || res.status >= 400 || res.isAxiosError) stats.errors++;
    }
    spinner.stopAndPersist({ symbol: logSymbols.success, text: 'Phase 3/6: high-rate burst sent' });

    // Phase 4: many distinct IPs from one provider/ASN
    const clusterRange = DATACENTER_RANGES[1];
    stats.clusterAsn = clusterRange.asn + ' (' + clusterRange.org + ')';
    spinner = ora('Phase 4/6: same-ASN distributed cluster').start();
    for (let i = 0; i < CLUSTER_REQUESTS; i++) {
        const headers = clusteredSourceHeaders(clusterRange);
        const config = {
            method: 'GET',
            url: targetURL + '/api/Products',
            params: { limit: PAGE_SIZE, offset: (i % PAGES) * PAGE_SIZE },
            headers,
        };
        stats.clusterRequests++;
        stats.sourceIps.add(headers['X-Forwarded-For']);
        stats.datacenterIps.add(headers['X-Forwarded-For']);
        stats.endpoints.add('/api/Products');
        spinner.text = `Phase 4/6: cluster ${i + 1}/${CLUSTER_REQUESTS} from ${headers['X-Forwarded-For']} (ASN ${clusterRange.asn})`;
        const res = await http().custom(config);
        if (!res || res.status >= 400 || res.isAxiosError) stats.errors++;
        await new Promise(r => setTimeout(r, 60));
    }
    spinner.stopAndPersist({ symbol: logSymbols.success, text: 'Phase 4/6: same-ASN cluster sent' });

    // Phase 5: stealth scraper. One anonymized-proxy IP views many product pages
    // slowly (under the rate limit) and never converts. Trips anon_proxy +
    // no_conversion, but not datacenter_ip or high_request_rate.
    spinner = ora('Phase 5/6: stealth scraper (proxy, no conversion)').start();
    const stealth = anonProxySourceHeaders();
    stats.stealthIp = stealth.headers['X-Forwarded-For'];
    // seed a search view, then walk product detail pages
    await http().custom({ method: 'GET', url: targetURL + '/rest/products/search', params: { q: 'a' }, headers: stealth.headers });
    stats.stealthViews++;
    stats.endpoints.add('/rest/products/search');
    for (let id = 1; id < STEALTH_VIEWS; id++) {
        const config = { method: 'GET', url: targetURL + '/api/Products/' + id, headers: stealth.headers };
        stats.stealthViews++;
        stats.proxyIps.add(stats.stealthIp);
        stats.endpoints.add('/api/Products/{id}');
        spinner.text = `Phase 5/6: stealth view ${id}/${STEALTH_VIEWS - 1} from ${stats.stealthIp} (${stealth.range.category}, no conversion)`;
        const res = await http().custom(config);
        if (!res || res.status >= 500 || res.isAxiosError) stats.errors++;
        await new Promise(r => setTimeout(r, 500));
    }
    spinner.stopAndPersist({ symbol: logSymbols.success, text: 'Phase 5/6: stealth scraper sent (proxy, no conversion)' });

    // Phase 6: distributed proxy sweep. Rotating anonymized-infra IPs paging the
    // catalog. Shows the threat-intel signal across many non-datacenter sources.
    spinner = ora('Phase 6/6: distributed proxy sweep').start();
    for (let i = 0; i < PROXY_REQUESTS; i++) {
        const { headers, range } = anonProxySourceHeaders();
        const config = {
            method: 'GET',
            url: targetURL + '/api/Products',
            params: { limit: PAGE_SIZE, offset: (i % PAGES) * PAGE_SIZE },
            headers,
        };
        stats.proxyRequests++;
        stats.proxyIps.add(headers['X-Forwarded-For']);
        stats.endpoints.add('/api/Products');
        spinner.text = `Phase 6/6: proxy ${i + 1}/${PROXY_REQUESTS} from ${headers['X-Forwarded-For']} (${range.category})`;
        const res = await http().custom(config);
        if (!res || res.status >= 400 || res.isAxiosError) stats.errors++;
        await new Promise(r => setTimeout(r, 120));
    }
    spinner.stopAndPersist({ symbol: logSymbols.success, text: 'Phase 6/6: distributed proxy sweep sent' });

    printSummary(targetURL, stats);
}

function printSummary(targetURL, stats) {
    const totalRequests = stats.reconRequests + stats.pageRequests
        + stats.searchRequests + stats.burstRequests + stats.clusterRequests
        + stats.stealthViews + stats.proxyRequests;

    console.log('');
    console.log(chalk.bold.cyan('  Distributed scraping summary'));
    console.log(chalk.gray('  ---------------------------------------------'));
    console.log(`  Target                 : ${targetURL}`);
    console.log(`  Total requests         : ${totalRequests}`);
    console.log(`    - recon probes       : ${stats.reconRequests} (${stats.reconPaths.join(', ')})`);
    console.log(`    - catalog pages      : ${stats.pageRequests} (limit=${PAGE_SIZE})`);
    console.log(`    - search queries     : ${stats.searchRequests} (${stats.searchTerms.join(', ')})`);
    console.log(`    - high-rate burst    : ${stats.burstRequests} (no delay, single IP)`);
    console.log(`    - same-ASN cluster   : ${stats.clusterRequests} (ASN ${stats.clusterAsn})`);
    console.log(`    - stealth scraper    : ${stats.stealthViews} views (proxy ${stats.stealthIp}, no conversion)`);
    console.log(`    - proxy sweep        : ${stats.proxyRequests} (rotating anonymized infra)`);
    console.log(`  Product rows harvested : ${stats.productsHarvested}`);
    console.log(`  Unique source IPs      : ${stats.sourceIps.size} datacenter, ${stats.proxyIps.size} proxy`);
    console.log(`  Unique User-Agents     : ${stats.userAgents.size}`);
    console.log(`  Failed requests        : ${stats.errors}`);
    console.log(chalk.gray('  ---------------------------------------------'));
    console.log(chalk.bold('  Bot giveaways exhibited (tagged on target spans):'));
    console.log(`    bot.signal.recon_path        <- Phase 1 (${stats.reconRequests} probes)`);
    console.log(`    bot.signal.datacenter_ip     <- Phases 1-4 (hosting-provider ASNs)`);
    console.log(`    bot.signal.high_request_rate <- Phase 3 (burst)`);
    console.log(`    bot.signal.asn_cluster       <- Phase 4 (${stats.clusterRequests} IPs, one ASN)`);
    console.log(`    bot.signal.no_conversion     <- Phase 5 (${stats.stealthViews} views, no booking)`);
    console.log(`    bot.signal.anon_proxy        <- Phases 5-6 (proxy / Tor / scanner infra)`);
    console.log(chalk.gray('  ---------------------------------------------'));
    console.log(chalk.yellow(
        '  In Datadog: Security > App and API Protection. Filter '
        + 'service:appsec-threat-emulation and query @bot.signal.* or '
        + '@appsec.events.business_logic.scraping.track:true. See docs/scraping.md.'
    ));
    console.log('');
}

module.exports = { distributedScrape };
