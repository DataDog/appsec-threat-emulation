// Unless explicitly stated otherwise all files in this repository are licensed under the Apache 2.0 License.
// This product includes software developed at Datadog (https://www.datadoghq.com/) Copyright 2023 Datadog, Inc.

const ora = require('ora');
const chalk = require('chalk');
const logSymbols = require('log-symbols');
const { http } = require('../lib/request');
const {
    datacenterSourceHeaders,
    clusteredSourceHeaders,
    DATACENTER_RANGES,
    RECON_PATHS,
} = require('../lib/rotation');

const PAGE_SIZE = 5;
const PAGES = 40;
const BURST_REQUESTS = 25;
const CLUSTER_REQUESTS = 20;

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
        searchTerms: [],
        reconPaths: [],
        clusterAsn: null,
        errors: 0,
        endpoints: new Set(),
    };

    // Phase 1: recon path probing
    let spinner = ora('Phase 1/4: probing recon paths').start();
    for (const path of RECON_PATHS) {
        const { headers, range } = datacenterSourceHeaders();
        const config = { method: 'GET', url: targetURL + path, headers };
        stats.reconRequests++;
        stats.reconPaths.push(path);
        stats.sourceIps.add(headers['X-Forwarded-For']);
        stats.datacenterIps.add(headers['X-Forwarded-For']);
        stats.userAgents.add(headers['User-Agent']);
        stats.endpoints.add(path);
        spinner.text = `Phase 1/4: probing ${path} from ${headers['X-Forwarded-For']} (${range.org})`;
        await http().custom(config);
        await new Promise(r => setTimeout(r, 120));
    }
    spinner.stopAndPersist({ symbol: logSymbols.success, text: 'Phase 1/4: recon paths probed' });

    // Phase 2: paginated catalog scrape from datacenter IPs
    spinner = ora('Phase 2/4: paginated catalog scrape').start();
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
        spinner.text = `Phase 2/4: page ${page + 1}/${PAGES} (offset ${offset}) from ${headers['X-Forwarded-For']}`;
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
        spinner.text = `Phase 2/4: search "${term}" from ${headers['X-Forwarded-For']}`;
        const res = await http().custom(config);
        if (!res || res.status >= 400 || res.isAxiosError) stats.errors++;
        await new Promise(r => setTimeout(r, 120));
    }
    spinner.stopAndPersist({ symbol: logSymbols.success, text: 'Phase 2/4: catalog scraped from datacenter IPs' });

    // Phase 3: high-rate burst from a single IP, no delay
    spinner = ora('Phase 3/4: high-rate burst').start();
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
        spinner.text = `Phase 3/4: burst ${i + 1}/${BURST_REQUESTS} from ${burstIp} (no delay)`;
        const res = await http().custom(config);
        if (!res || res.status >= 400 || res.isAxiosError) stats.errors++;
    }
    spinner.stopAndPersist({ symbol: logSymbols.success, text: 'Phase 3/4: high-rate burst sent' });

    // Phase 4: many distinct IPs from one provider/ASN
    const clusterRange = DATACENTER_RANGES[1];
    stats.clusterAsn = clusterRange.asn + ' (' + clusterRange.org + ')';
    spinner = ora('Phase 4/4: same-ASN distributed cluster').start();
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
        spinner.text = `Phase 4/4: cluster ${i + 1}/${CLUSTER_REQUESTS} from ${headers['X-Forwarded-For']} (ASN ${clusterRange.asn})`;
        const res = await http().custom(config);
        if (!res || res.status >= 400 || res.isAxiosError) stats.errors++;
        await new Promise(r => setTimeout(r, 60));
    }
    spinner.stopAndPersist({ symbol: logSymbols.success, text: 'Phase 4/4: same-ASN cluster sent' });

    printSummary(targetURL, stats);
}

function printSummary(targetURL, stats) {
    const totalRequests = stats.reconRequests + stats.pageRequests
        + stats.searchRequests + stats.burstRequests + stats.clusterRequests;

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
    console.log(`  Product rows harvested : ${stats.productsHarvested}`);
    console.log(`  Unique source IPs      : ${stats.sourceIps.size} (${stats.datacenterIps.size} datacenter)`);
    console.log(`  Unique User-Agents     : ${stats.userAgents.size}`);
    console.log(`  Failed requests        : ${stats.errors}`);
    console.log(chalk.gray('  ---------------------------------------------'));
    console.log(chalk.bold('  Bot giveaways exhibited (tagged on target spans):'));
    console.log(`    bot.signal.recon_path        <- Phase 1 (${stats.reconRequests} probes)`);
    console.log(`    bot.signal.datacenter_ip     <- Phases 1-4 (hosting-provider ASNs)`);
    console.log(`    bot.signal.high_request_rate <- Phase 3 (burst)`);
    console.log(`    bot.signal.asn_cluster       <- Phase 4 (${stats.clusterRequests} IPs, one ASN)`);
    console.log(chalk.gray('  ---------------------------------------------'));
    console.log(chalk.yellow(
        '  In Datadog: Security > App and API Protection. Filter '
        + 'service:appsec-threat-emulation and query @bot.signal.* or '
        + '@appsec.events.business_logic.scraping.track:true. See docs/scraping.md.'
    ));
    console.log('');
}

module.exports = { distributedScrape };
