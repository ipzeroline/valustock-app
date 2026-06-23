#!/bin/bash
# =============================================================================
# ValuStock — Calendar Sync Cron Script
# ดึงข้อมูลจาก investing.com → MongoDB
# ใช้คู่กับ cron: 0 7 * * * /path/to/scripts/run-calendar-sync-daily.sh
#
# Types ที่ทำงานได้: economic, holiday, earnings, dividends, stock_split, ipo
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

# Server crontab should call the local Next.js app to avoid external gateway timeouts.
# Override CALENDAR_SYNC_URL if the app listens on a different host/port.
BASE_URL="${CALENDAR_SYNC_URL:-http://127.0.0.1:${PORT:-7887}}"
BASE_URL="${BASE_URL%/}"
CRON_SECRET="${CRON_SECRET:-}"
ENDPOINT="/api/cron/economic-events"

# sync all calendar types — no replace (upsert mode = safer, no data loss)
TYPES="${CALENDAR_SYNC_TYPES:-economic,holiday,earnings,dividends,stock_split,ipo}"
ECONOMIC_TIME_FILTER="${ECONOMIC_TIME_FILTER:-thisWeek}"

TIMEOUT=180
RESPONSE_FILE="$(mktemp /tmp/valustock-calendar-sync.XXXXXX.json)"

trap 'rm -f "${RESPONSE_FILE}"' EXIT

# ── Log ─────────────────────────────────────────────────────────────────────

log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*"
}

# ── Main ────────────────────────────────────────────────────────────────────

log "========================================="
log "Calendar Sync — Starting (types: ${TYPES})"
log "Calendar Sync — Endpoint: ${BASE_URL}${ENDPOINT}"
log "========================================="

if [ -z "${CRON_SECRET}" ]; then
  log "❌ CRON_SECRET is not set"
  exit 1
fi

START_TS=$(date +%s)
FAILURES=0
TOTAL_FETCHED=0
TOTAL_UPSERTED=0
TOTAL_DELETED=0

IFS=',' read -ra TYPE_LIST <<< "${TYPES}"
for TYPE in "${TYPE_LIST[@]}"; do
  TYPE="$(echo "${TYPE}" | xargs)"
  if [ -z "${TYPE}" ]; then
    continue
  fi

  : > "${RESPONSE_FILE}"
  TYPE_START_TS=$(date +%s)
  log "→ Syncing ${TYPE}"
  REQUEST_URL="${BASE_URL}${ENDPOINT}?types=${TYPE}"
  if [ "${TYPE}" = "economic" ] && [ -n "${ECONOMIC_TIME_FILTER}" ]; then
    REQUEST_URL="${REQUEST_URL}&timeFilter=${ECONOMIC_TIME_FILTER}"
  fi

  HTTP_CODE=$(curl -sS -w "%{http_code}" -o "${RESPONSE_FILE}" \
    -X GET "${REQUEST_URL}" \
    -H "x-cron-secret: ${CRON_SECRET}" \
    --connect-timeout 30 \
    --max-time ${TIMEOUT}) || HTTP_CODE="curl-failed"

  TYPE_END_TS=$(date +%s)
  TYPE_ELAPSED=$((TYPE_END_TS - TYPE_START_TS))

  if [ "$HTTP_CODE" = "200" ]; then
    log "✅ ${TYPE} HTTP ${HTTP_CODE} — completed in ${TYPE_ELAPSED}s"
    if command -v jq &>/dev/null; then
      FETCHED=$(jq -r '.totalFetched // 0' "${RESPONSE_FILE}" 2>/dev/null || echo 0)
      UPSERTED=$(jq -r '.totalUpserted // 0' "${RESPONSE_FILE}" 2>/dev/null || echo 0)
      DELETED=$(jq -r '.totalDeleted // 0' "${RESPONSE_FILE}" 2>/dev/null || echo 0)
      TOTAL_FETCHED=$((TOTAL_FETCHED + FETCHED))
      TOTAL_UPSERTED=$((TOTAL_UPSERTED + UPSERTED))
      TOTAL_DELETED=$((TOTAL_DELETED + DELETED))
      jq -r '.results[] | "  [\(.type)] fetched=\(.fetched) upserted=\(.upserted) deleted=\(.deleted) \(.durationMs)ms\(if .error then " ⚠️ \(.error)" else "" end)"' \
        "${RESPONSE_FILE}" 2>/dev/null || true
    else
      head -c 500 "${RESPONSE_FILE}"
      echo ""
    fi
  elif [ "$HTTP_CODE" = "401" ]; then
    log "❌ ${TYPE} HTTP ${HTTP_CODE} — Unauthorized (check CRON_SECRET)"
    exit 1
  else
    FAILURES=$((FAILURES + 1))
    log "❌ ${TYPE} HTTP ${HTTP_CODE} — Failed after ${TYPE_ELAPSED}s"
    cat "${RESPONSE_FILE}" 2>/dev/null || true
  fi
done

END_TS=$(date +%s)
ELAPSED=$((END_TS - START_TS))

log "Summary: fetched=${TOTAL_FETCHED} upserted=${TOTAL_UPSERTED} deleted=${TOTAL_DELETED} failures=${FAILURES}"

if [ "${FAILURES}" -gt 0 ]; then
  exit 1
fi

log "========================================="
log "Calendar Sync — Done (wall time: ${ELAPSED}s)"
log ""
