#!/bin/bash
# =============================================================================
# ValuStock — Calendar Sync Cron Script
# ดึงข้อมูลจาก investing.com ทั้ง 6 ปฏิทิน → MongoDB
# ใช้คู่กับ cron: 0 7 * * * /home/deploy/apps/valustock-app/scripts/run-calendar-sync-daily.sh
# =============================================================================

set -euo pipefail

# ── Config ──────────────────────────────────────────────────────────────────

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

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
fi

BASE_URL="${CALENDAR_SYNC_URL:-${NEXT_PUBLIC_SITE_URL:-https://valustock.com}}"
BASE_URL="${BASE_URL%/}"
CRON_SECRET="${CRON_SECRET:-}"
ENDPOINT="/api/cron/calendar-sync"
REPLACE="${CALENDAR_SYNC_REPLACE:-1}"
TIMEOUT=300
RESPONSE_FILE="$(mktemp /tmp/valustock-calendar-sync.XXXXXX.json)"

trap 'rm -f "${RESPONSE_FILE}"' EXIT

# ── Log ─────────────────────────────────────────────────────────────────────

log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*"
}

# ── Main ────────────────────────────────────────────────────────────────────

log "========================================="
log "Calendar Sync — Starting"
log "========================================="

if [ -z "${CRON_SECRET}" ]; then
  log "❌ CRON_SECRET is not set"
  exit 1
fi

START_TS=$(date +%s)

HTTP_CODE=$(curl -sS -w "%{http_code}" -o "${RESPONSE_FILE}" \
  -X GET "${BASE_URL}${ENDPOINT}?replace=${REPLACE}" \
  -H "x-cron-secret: ${CRON_SECRET}" \
  --connect-timeout 30 \
  --max-time ${TIMEOUT})

END_TS=$(date +%s)
ELAPSED=$((END_TS - START_TS))

if [ "$HTTP_CODE" = "200" ]; then
  log "✅ HTTP ${HTTP_CODE} — completed in ${ELAPSED}s"
  # Print summary from response
  if command -v jq &>/dev/null; then
    jq -r '"  Replace: \(.replace) | Calendars: \(.calendars) | Deleted: \(.totalDeleted) | Fetched: \(.totalFetched) | Upserted: \(.totalUpserted) | Duration: \(.totalDurationMs)ms"' \
      "${RESPONSE_FILE}" 2>/dev/null || true
    # Print per-calendar results
    jq -r '.results[] | "  [\(.type)] deleted=\(.deleted) fetched=\(.fetched) upserted=\(.upserted) \(.durationMs)ms\(if .error then " ERROR: "+.error else "" end)"' \
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
