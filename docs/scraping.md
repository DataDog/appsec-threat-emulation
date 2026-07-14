# Distributed catalog scraping (attack #12)

Attack #12 emulates a bot/scraper harvesting the Juice Shop product catalog while
deliberately exhibiting the behaviours that give automated traffic away. A
dd-trace preload on the target (`tracing/bot-signals.js`) tags each inbound
request span with those signals so Datadog **custom detection rules** and
**App and API Protection (AAP)** can identify the threat.

```
docker exec -it appsec-threat-emulation ./cli run -a 12
```

## Bot giveaways the attack exhibits

| Phase | Behaviour (bot giveaway) | Emulated by |
| ----- | ------------------------ | ----------- |
| 1 | Probing recon paths a human never loads (`/robots.txt`, `/sitemap.xml`, `/.well-known/security.txt`, `/.git/config`, `/admin`) | one request per path |
| 2 | Steady catalog enumeration over `/api/Products` (limit/offset paging) and `/rest/products/search`, all from **datacenter/hosting IPs** | 48 requests from rotating cloud ASNs |
| 3 | **Too many requests, too fast** from a single IP | 25-request burst, no delay |
| 4 | A **cluster of many distinct IPs sharing one ASN** (distributed bot) | 20 requests from one provider `/16` |

Source IPs are rotated across real hosting-provider ASNs (DigitalOcean 14061,
Linode 63949, OVH 16276, Hetzner 24940, AWS 16509, GCP 396982) via
`X-Forwarded-For` / `X-Real-IP` / `Forwarded` headers.

## Span tags applied on the target

`tracing/bot-signals.js` is injected into the Juice Shop process with
`NODE_OPTIONS=--require` and tags each request span:

| Tag | Meaning |
| --- | ------- |
| `bot.signal.recon_path` (`true`) | request hit a known recon path |
| `bot.recon.path` | the recon path that was hit |
| `bot.signal.datacenter_ip` (`true`) | client IP belongs to a hosting/cloud ASN (see ASN resolution below) |
| `network.client.asn` / `network.client.asn_org` | resolved ASN number / org (from the ASN database) |
| `bot.signal.high_request_rate` (`true`) | client IP exceeded the human rate threshold |
| `bot.client.request_rate` | requests from this IP in the sliding window |
| `bot.signal.asn_cluster` (`true`) | many distinct IPs from one ASN seen recently |
| `bot.client.asn_ip_count` | distinct IPs observed for this ASN in the window |
| `bot.score` | count of signals that fired (0–4) |

When `bot.score >= 2`, a business-logic AppSec event is also emitted via
`tracer.appsec.trackCustomEvent('business_logic.scraping', {...})`, which surfaces
in traces as `@appsec.events.business_logic.scraping.track:true` with
`client.ip`, `client.asn`, `request.path`, and `bot.score` metadata.

Thresholds live at the top of `tracing/bot-signals.js`
(`RATE_THRESHOLD`, `CLUSTER_THRESHOLD`, `RATE_WINDOW_MS`).

## ASN resolution (MaxMind-style)

Client IPs are resolved to their ASN with a real, CIDR-precise IP→ASN database
read by the [`maxmind`](https://www.npmjs.com/package/maxmind) reader. Because an
ASN database resolves *every* IP (residential ISPs included), the preload also
classifies the resolved ASN as hosting/datacenter using a `HOSTING_ASNS`
allowlist (AWS, GCP, Azure, DigitalOcean, Linode/Akamai, OVH, Hetzner, Vultr,
etc.). Only hosting ASNs set `bot.signal.datacenter_ip`; a residential IP still
gets `network.client.asn` / `asn_org` but is not flagged. For example a Comcast
IP resolves to `AS7922 / Comcast Cable Communications` with no datacenter signal.

Enable it with a one-time database download:

```
./tracing/fetch-asn-db.sh
docker compose up -d --force-recreate juiceshop
```

This fetches the free **DB-IP ASN Lite** database (MaxMind `.mmdb` format,
licensed CC-BY 4.0, no license key) to `tracing/data/dbip-asn-lite.mmdb`. You can
substitute MaxMind's own `GeoLite2-ASN.mmdb` at the same path. The `maxmind` npm
package is installed under `tracing/` and bind-mounted into the target with the
preload. If the database or module is absent, the preload logs a notice and falls
back to a small built-in `/16` prefix table so the demo still works with zero
setup (with less accurate, provider-approximate ASNs).

> Attribution: IP-to-ASN data by [DB-IP](https://db-ip.com), licensed under
> [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).

## Detecting it in Datadog

References:
- [Add user & business logic info (Node.js)](https://docs.datadoghq.com/security/application_security/how-it-works/add-user-info/?tab=nodejs)
- [Detect and manage account takeover with AAP](https://docs.datadoghq.com/security/application_security/guide/manage_account_theft_appsec/?tab=bruteforce)

### Option A — Custom detection rule on the emitted signals

In **Security > App and API Protection > Detection Rules > New Rule** (Trace
based), filter to the service and match on the signals:

```
service:appsec-threat-emulation @appsec.events.business_logic.scraping.track:true
```

or match the raw span tags directly, e.g. a distributed scraper:

```
service:appsec-threat-emulation @bot.signal.datacenter_ip:true (@bot.signal.asn_cluster:true OR @bot.signal.high_request_rate:true)
```

Group by `@network.client.asn` (or `@http.client_ip`) and alert when the count
crosses a threshold over a rolling window. A starter rule payload is in
[`detection-rules/scraping-bot.json`](./detection-rules/scraping-bot.json).

### Option B — In-App WAF custom rule (no code change)

Per the AAP guide, custom In-App WAF rules can extract request metadata (URI
regex, method, headers) via Remote Configuration. Use this to flag the recon
probes and rate/ASN patterns even without the preload, matching on `server.request.uri.raw`
(e.g. `^/(robots\.txt|sitemap\.xml|\.git/)`) and the client IP address.

The preload (Option A) is the richer path: it turns "datacenter IP", "same-ASN
cluster", and "too fast" into first-class span tags that a rule can match and
group on directly.

## Operational note

`tracing/bot-signals.js` is bind-mounted into the `juiceshop` container. When you
edit it, a plain `docker compose up -d` will **not** reload it (the service
definition is unchanged, so the container is not recreated). Force a reload:

```
docker compose up -d --force-recreate juiceshop
```
