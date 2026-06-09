#!/bin/bash
# =============================================================================
# ValuStock — Calendar Sync Cron Script
# ดึงข้อมูลจาก investing.com → MongoDB
# ใช้คู่กับ cron: 0 7 * * * /path/to/scripts/run-calendar-sync-daily.sh
#
# Types ที่ทำงานได้: economic, holiday, earnings, stock_split, ipo
# dividends: scraper ต้อง rewrite (investing.com เปลี่ยนโครงสร้างหน้า)
# =============================================================================

set -euo pipefail

# ── Config ──────────────────────────────────────────────────────────────────

# Ensure standard paths are included for cron execution
PATH="/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin:${PATH:-}"
export PATH

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

# Load environment variables (trying .env.production, .env.local, then .env)
if [ -f "${APP_DIR}/.env.production" ]; then
  set -a
  # shellcheck disable=SC1091
  source "${APP_DIR}/.env.production"
  set +a
elif [ -f "${APP_DIR}/.env.local" ]; then
  set -a
  # shellcheck disable=SC1091
  source "${APP_DIR}/.env.local"
  set +a
elif [ -f "${APP_DIR}/.env" ]; then
  set -a
  # shellcheck disable=SC1091
  source "${APP_DIR}/.env"
  set +a
fi

BASE_URL="${CALENDAR_SYNC_URL:-${NEXT_PUBLIC_SITE_URL:-https://valustock.com}}"
BASE_URL="${BASE_URL%/}"
CRON_SECRET="${CRON_SECRET:-}"
ENDPOINT="/api/cron/calendar-sync"

# sync all working types — no replace (upsert mode = safer, no data loss)
# dividends excluded: scraper broken (investing.com restructured page)
TYPES="${CALENDAR_SYNC_TYPES:-economic,holiday,earnings,stock_split,ipo}"

TIMEOUT=300
RESPONSE_FILE="$(mktemp /tmp/valustock-calendar-sync.XXXXXX.json)"

trap 'rm -f "${RESPONSE_FILE}"' EXIT

# ── Log ─────────────────────────────────────────────────────────────────────

log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*"
}

# ── Main ────────────────────────────────────────────────────────────────────

log "========================================="
log "Calendar Sync — Starting (types: ${TYPES})"
log "========================================="

if [ -z "${CRON_SECRET}" ]; then
  log "❌ CRON_SECRET is not set"
  exit 1
fi

START_TS=$(date +%s)

HTTP_CODE=$(curl -sS -w "%{http_code}" -o "${RESPONSE_FILE}" \
  -X GET "${BASE_URL}${ENDPOINT}?types=${TYPES}" \
  -H "x-cron-secret: ${CRON_SECRET}" \
  --connect-timeout 30 \
  --max-time ${TIMEOUT})

END_TS=$(date +%s)
ELAPSED=$((END_TS - START_TS))

if [ "$HTTP_CODE" = "200" ]; then
  log "✅ HTTP ${HTTP_CODE} — completed in ${ELAPSED}s"
  # Print summary from response
  if command -v jq &>/dev/null; then
    jq -r '"  Calendars: \(.calendars) | Fetched: \(.totalFetched) | Upserted: \(.totalUpserted) | Deleted: \(.totalDeleted) | Duration: \(.totalDurationMs)ms"' \
      "${RESPONSE_FILE}" 2>/dev/null || true
    # Print per-type results
    jq -r '.results[] | "  [\(.type)] fetched=\(.fetched) upserted=\(.upserted) \(.durationMs)ms\(if .error then " ⚠️ \(.error)" else "" end)"' \
      "${RESPONSE_FILE}" 2>/dev/null || true
  else
    head -c 500 "${RESPONSE_FILE}"
    echo ""
  fi
elif [ "$HTTP_CODE" = "401" ]; then
  log "❌ HTTP ${HTTP_CODE} — Unauthorized (check CRON_SECRET)"
  exit 1
else
  log "❌ HTTP ${HTTP_CODE} — Failed"
  cat "${RESPONSE_FILE}" 2>/dev/null || true
  exit 1
fi

log "========================================="
log "Calendar Sync — Done (wall time: ${ELAPSED}s)"
log ""
