#!/usr/bin/env bash
# =============================================================================
# PuraEstate – Stack Health Check Script
# =============================================================================
# Checks the status of all services in the stack and prints a summary.
#
# Usage:
#   ./scripts/healthcheck.sh
# =============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEPLOY_DIR="$(dirname "$SCRIPT_DIR")"
COMPOSE_FILE="${DEPLOY_DIR}/docker-compose.yml"
ENV_FILE="${DEPLOY_DIR}/.env"

if [[ -f "${ENV_FILE}" ]]; then
    set -o allexport
    # shellcheck disable=SC1091
    source "${ENV_FILE}"
    set +o allexport
fi

DOMAIN="${DOMAIN:-puraestate.com}"

# ---------------------------------------------------------------------------
# Colors
# ---------------------------------------------------------------------------
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

ok()   { echo -e "  ${GREEN}[OK]${NC}    $*"; }
fail() { echo -e "  ${RED}[FAIL]${NC}  $*"; }
warn() { echo -e "  ${YELLOW}[WARN]${NC}  $*"; }

compose() {
    docker compose -f "${COMPOSE_FILE}" --env-file "${ENV_FILE}" "$@"
}

# ---------------------------------------------------------------------------
# Header
# ---------------------------------------------------------------------------
echo ""
echo "============================================================"
echo "  PuraEstate Stack Health Check – $(date '+%Y-%m-%d %H:%M:%S')"
echo "============================================================"
echo ""

# ---------------------------------------------------------------------------
# Container status
# ---------------------------------------------------------------------------
echo "Container Status:"
compose ps --format "table {{.Name}}\t{{.Status}}\t{{.Health}}"
echo ""

# ---------------------------------------------------------------------------
# Service-level checks
# ---------------------------------------------------------------------------
echo "Service Health:"

# PostgreSQL
PG_STATUS=$(compose exec -T postgres pg_isready -U "${POSTGRES_USER:-puraestate}" 2>&1 || echo "FAIL")
if echo "${PG_STATUS}" | grep -q "accepting connections"; then
    ok "PostgreSQL – accepting connections"
else
    fail "PostgreSQL – ${PG_STATUS}"
fi

# Redis
REDIS_PONG=$(compose exec -T redis redis-cli -a "${REDIS_PASSWORD}" ping 2>/dev/null | tr -d '[:space:]' || echo "FAIL")
if [[ "${REDIS_PONG}" == "PONG" ]]; then
    ok "Redis – PONG received"
else
    fail "Redis – ${REDIS_PONG}"
fi

# Flask
FLASK_HEALTH=$(compose exec -T flask curl -sf http://localhost:5000/health 2>/dev/null || echo "FAIL")
if echo "${FLASK_HEALTH}" | grep -q '"healthy"'; then
    ok "Flask API – healthy"
elif [[ "${FLASK_HEALTH}" == "FAIL" ]]; then
    fail "Flask API – not responding"
else
    warn "Flask API – ${FLASK_HEALTH}"
fi

# Next.js
NEXTJS_STATUS=$(compose exec -T frontend curl -so /dev/null -w "%{http_code}" http://localhost:3000/ 2>/dev/null || echo "000")
if [[ "${NEXTJS_STATUS}" == "200" ]]; then
    ok "Next.js – HTTP 200"
else
    fail "Next.js – HTTP ${NEXTJS_STATUS}"
fi

# Nginx
NGINX_STATUS=$(curl -so /dev/null -w "%{http_code}" http://localhost/nginx-health 2>/dev/null || echo "000")
if [[ "${NGINX_STATUS}" == "200" ]]; then
    ok "Nginx – HTTP 200"
else
    fail "Nginx – HTTP ${NGINX_STATUS}"
fi

# HTTPS (external)
HTTPS_STATUS=$(curl -so /dev/null -w "%{http_code}" "https://${DOMAIN}/health" --max-time 10 2>/dev/null || echo "000")
if [[ "${HTTPS_STATUS}" == "200" ]]; then
    ok "HTTPS – https://${DOMAIN}/health → 200"
else
    warn "HTTPS – https://${DOMAIN}/health → ${HTTPS_STATUS}"
fi

# SSL Certificate expiry
CERT_EXPIRY=$(echo | openssl s_client -connect "${DOMAIN}:443" -servername "${DOMAIN}" 2>/dev/null \
    | openssl x509 -noout -enddate 2>/dev/null | cut -d= -f2 || echo "UNKNOWN")
EXPIRY_EPOCH=$(date -d "${CERT_EXPIRY}" +%s 2>/dev/null || echo 0)
NOW_EPOCH=$(date +%s)
DAYS_LEFT=$(( (EXPIRY_EPOCH - NOW_EPOCH) / 86400 ))
if [[ ${DAYS_LEFT} -gt 30 ]]; then
    ok "SSL Certificate – expires in ${DAYS_LEFT} days (${CERT_EXPIRY})"
elif [[ ${DAYS_LEFT} -gt 0 ]]; then
    warn "SSL Certificate – expires in ${DAYS_LEFT} days (renew soon!)"
else
    fail "SSL Certificate – expired or unknown"
fi

# Celery
CELERY_PING=$(compose exec -T celery celery -A "${CELERY_APP:-celery_worker:celery_app}" inspect ping --timeout=5 2>/dev/null || echo "FAIL")
if echo "${CELERY_PING}" | grep -q "pong"; then
    ok "Celery Worker – pong received"
else
    fail "Celery Worker – not responding"
fi

# ---------------------------------------------------------------------------
# Resource usage
# ---------------------------------------------------------------------------
echo ""
echo "Resource Usage:"
docker stats --no-stream --format "  {{.Name}}\tCPU: {{.CPUPerc}}\tMEM: {{.MemUsage}}" \
    $(compose ps -q) 2>/dev/null || true

# ---------------------------------------------------------------------------
# Disk usage
# ---------------------------------------------------------------------------
echo ""
echo "Disk Usage (Docker volumes):"
docker system df --verbose 2>/dev/null | grep "puraestate" || true

echo ""
echo "============================================================"
echo "  Health check complete – $(date '+%Y-%m-%d %H:%M:%S')"
echo "============================================================"
echo ""
