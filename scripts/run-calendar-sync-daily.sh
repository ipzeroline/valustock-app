#!/bin/bash
# =============================================================================
# ValuStock — Calendar Sync Cron Script
# ดึงข้อมูลจาก investing.com ทั้ง 6 ปฏิทิน → MongoDB
# ใช้คู่กับ cron: 0 7 * * * /home/deploy/apps/valustock-app/scripts/run-calendar-sync-daily.sh
# =============================================================================

set -euo pipefail

# ── Config ──────────────────────────────────────────────────────────────────

BASE_URL="${CALENDAR_SYNC_URL:-https://valustock.com}"
CRON_SECRET="${CRON_SECRET:-9e6b79d015cf0bb37be3d699098a0bc8af0d6ab66cb93fd35a33cf4fe6dab1d8}"
ENDPOINT="/api/cron/calendar-sync"
TIMEOUT=300

# ── Log ─────────────────────────────────────────────────────────────────────

log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*"
}

# ── Main ────────────────────────────────────────────────────────────────────

log "========================================="
log "Calendar Sync — Starting"
log "========================================="

START_TS=$(date +%s)

HTTP_CODE=$(curl -s -w "%{http_code}" -o /tmp/valustock-calendar-sync.json \
  -X GET "${BASE_URL}${ENDPOINT}" \
  -H "x-cron-secret: ${CRON_SECRET}" \
  --max-time ${TIMEOUT})

END_TS=$(date +%s)
ELAPSED=$((END_TS - START_TS))

if [ "$HTTP_CODE" = "200" ]; then
  log "✅ HTTP ${HTTP_CODE} — completed in ${ELAPSED}s"
  # Print summary from response
  if command -v jq &>/dev/null; then
    jq -r '"  Calendars: \(.calendars) | Fetched: \(.totalFetched) | Upserted: \(.totalUpserted) | Duration: \(.totalDurationMs)ms"' \
      /tmp/valustock-calendar-sync.json 2>/dev/null || true
    # Print per-calendar results
    jq -r '.results[] | "  [\(.type)] fetched=\(.fetched) upserted=\(.upserted) \(.durationMs)ms\(if .error then " ERROR: "+.error else "" end)"' \
      /tmp/valustock-calendar-sync.json 2>/dev/null || true
  else
    head -c 500 /tmp/valustock-calendar-sync.json
    echo ""
  fi
elif [ "$HTTP_CODE" = "401" ]; then
  log "❌ HTTP ${HTTP_CODE} — Unauthorized (check CRON_SECRET)"
else
  log "❌ HTTP ${HTTP_CODE} — Failed"
  cat /tmp/valustock-calendar-sync.json 2>/dev/null || true
fi

log "========================================="
log "Calendar Sync — Done (wall time: ${ELAPSED}s)"
log ""
