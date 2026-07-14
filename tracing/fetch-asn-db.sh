#!/usr/bin/env bash
# Unless explicitly stated otherwise all files in this repository are licensed under the Apache 2.0 License.
# This product includes software developed at Datadog (https://www.datadoghq.com/) Copyright 2023 Datadog, Inc.
#
# Downloads a real IP->ASN database so tracing/bot-signals.js can do
# MaxMind-style, CIDR-precise ASN resolution of client IPs (instead of the
# built-in /16 fallback table).
#
# Default source: DB-IP ASN Lite (https://db-ip.com/db/download/ip-to-asn-lite),
# free, monthly, licensed CC-BY 4.0 (attribution required, no license key).
# The file format is MaxMind .mmdb and is read by the `maxmind` npm package.
#
# You can instead drop MaxMind's own GeoLite2-ASN.mmdb at the target path.
#
# Usage:  ./tracing/fetch-asn-db.sh
set -euo pipefail

DEST_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/data"
DEST="${DEST_DIR}/dbip-asn-lite.mmdb"
mkdir -p "${DEST_DIR}"

# Try the current and two previous months (DB-IP publishes monthly).
for offset in 0 1 2; do
  YM="$(date -u -v-"${offset}"m +%Y-%m 2>/dev/null || date -u -d "-${offset} month" +%Y-%m)"
  URL="https://download.db-ip.com/free/dbip-asn-lite-${YM}.mmdb.gz"
  echo "Trying ${URL} ..."
  if curl -fsSL "${URL}" | gunzip -c > "${DEST}.tmp" 2>/dev/null && [ -s "${DEST}.tmp" ]; then
    mv "${DEST}.tmp" "${DEST}"
    echo "Saved ${DEST} ($(du -h "${DEST}" | cut -f1))"
    echo "Now reload the target:  docker compose up -d --force-recreate juiceshop"
    exit 0
  fi
  rm -f "${DEST}.tmp"
done

echo "Could not download an ASN database. bot-signals.js will use its built-in /16 fallback table." >&2
exit 1
