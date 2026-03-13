#!/usr/bin/env bash
# =============================================================================
# PuraEstate – Comprehensive Stack Health Check Script
# =============================================================================
# Performs comprehensive health checks on all services including:
#   - Container status and health
#   - Database connectivity and performance
#   - Redis connectivity
#   - API response times
#   - SSL certificate expiry monitoring
#   - Disk and memory usage
#   - Resource utilization per service
#
# Usage:
#   ./scripts/healthcheck.sh [--detailed]
#
# Options:
#   --detailed    Show detailed metrics and response times
# =============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEPLOY_DIR="$(dirname "$SCRIPT_DIR")"
COMPOSE_FILE="${DEPLOY_DIR}/docker/docker-compose.yml"
ENV_FILE="${DEPLOY_DIR}/.env"
DETAILED_MODE=false

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --detailed)
            DETAILED_MODE=true
            shift
            ;;
        *)
            shift
            ;;
    esac
done

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
BLUE='\033[0;34m'
NC='\033[0m'

ok()    { echo -e "  ${GREEN}[OK]${NC}    $*"; }
fail()  { echo -e "  ${RED}[FAIL]${NC}  $*"; }
warn()  { echo -e "  ${YELLOW}[WARN]${NC}  $*"; }
info()  { echo -e "  ${BLUE}[INFO]${NC}  $*"; }

# Health check tracking
HEALTH_CHECKS_PASS=0
HEALTH_CHECKS_FAIL=0
HEALTH_CHECKS_WARN=0

pass_check() { ((HEALTH_CHECKS_PASS++)); }
fail_check() { ((HEALTH_CHECKS_FAIL++)); }
warn_check() { ((HEALTH_CHECKS_WARN++)); }

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
# Container Status
# ---------------------------------------------------------------------------
echo "Container Status:"
echo "────────────────────────────────────────────────────────────"
compose ps --format "table {{.Name}}\t{{.Status}}\t{{.Health}}" || true
echo ""

# ---------------------------------------------------------------------------
# Service-Level Health Checks
# ---------------------------------------------------------------------------
echo "Service Health Checks:"
echo "────────────────────────────────────────────────────────────"

# PostgreSQL
PG_STATUS=$(compose exec -T postgres pg_isready -U "${POSTGRES_USER:-puraestate}" 2>&1 || echo "FAIL")
if echo "${PG_STATUS}" | grep -q "accepting connections"; then
    ok "PostgreSQL – accepting connections"
    pass_check
else
    fail "PostgreSQL – ${PG_STATUS}"
    fail_check
fi

# PostgreSQL Performance
if [[ "${DETAILED_MODE}" == "true" ]]; then
    PG_SIZE=$(compose exec -T postgres psql -U "${POSTGRES_USER:-puraestate}" -d "${POSTGRES_DB:-puraestate_prod}" \
        -c "SELECT pg_size_pretty(pg_database_size(current_database()));" 2>/dev/null | grep -oE '[0-9.]+ [KMGT]B' || echo "unknown")
    info "PostgreSQL database size: ${PG_SIZE}"

    PG_CONNECTIONS=$(compose exec -T postgres psql -U "${POSTGRES_USER:-puraestate}" -d "${POSTGRES_DB:-puraestate_prod}" \
        -c "SELECT count(*) FROM pg_stat_activity;" 2>/dev/null | tail -1 | tr -d ' ' || echo "unknown")
    info "PostgreSQL active connections: ${PG_CONNECTIONS}"
fi

# Redis
REDIS_PONG=$(compose exec -T redis redis-cli -a "${REDIS_PASSWORD}" ping 2>/dev/null | tr -d '[:space:]' || echo "FAIL")
if [[ "${REDIS_PONG}" == "PONG" ]]; then
    ok "Redis – PONG received"
    pass_check
else
    fail "Redis – ${REDIS_PONG}"
    fail_check
fi

# Redis Memory Usage
if [[ "${DETAILED_MODE}" == "true" ]]; then
    REDIS_MEMORY=$(compose exec -T redis redis-cli -a "${REDIS_PASSWORD}" info memory 2>/dev/null | grep "used_memory_human" | cut -d: -f2 | tr -d '\r' || echo "unknown")
    info "Redis memory usage: ${REDIS_MEMORY}"

    REDIS_KEYS=$(compose exec -T redis redis-cli -a "${REDIS_PASSWORD}" dbsize 2>/dev/null | grep -oE '[0-9]+' | head -1 || echo "unknown")
    info "Redis keys stored: ${REDIS_KEYS}"
fi

# Flask API
FLASK_HEALTH=$(compose exec -T flask curl -sf http://localhost:5000/health 2>/dev/null || echo "FAIL")
if echo "${FLASK_HEALTH}" | grep -q '"healthy"'; then
    ok "Flask API – healthy"
    pass_check
elif [[ "${FLASK_HEALTH}" == "FAIL" ]]; then
    fail "Flask API – not responding"
    fail_check
else
    warn "Flask API – ${FLASK_HEALTH}"
    warn_check
fi

# Flask Response Time
if [[ "${DETAILED_MODE}" == "true" ]]; then
    FLASK_TIME=$(compose exec -T flask curl -w '%{time_total}' -o /dev/null -s http://localhost:5000/health 2>/dev/null || echo "unknown")
    if [[ "${FLASK_TIME}" != "unknown" ]]; then
        FLASK_TIME_MS=$(echo "${FLASK_TIME} * 1000" | bc 2>/dev/null | cut -d. -f1)
        info "Flask API response time: ${FLASK_TIME_MS}ms"
    fi
fi

# Next.js Frontend
NEXTJS_STATUS=$(compose exec -T frontend curl -so /dev/null -w "%{http_code}" http://localhost:3000/ 2>/dev/null || echo "000")
if [[ "${NEXTJS_STATUS}" == "200" ]]; then
    ok "Next.js – HTTP 200"
    pass_check
else
    fail "Next.js – HTTP ${NEXTJS_STATUS}"
    fail_check
fi

# Nginx
NGINX_STATUS=$(curl -so /dev/null -w "%{http_code}" http://localhost/nginx-health 2>/dev/null || echo "000")
if [[ "${NGINX_STATUS}" == "200" ]]; then
    ok "Nginx – HTTP 200"
    pass_check
else
    fail "Nginx – HTTP ${NGINX_STATUS}"
    fail_check
fi

# HTTPS (external)
HTTPS_STATUS=$(curl -so /dev/null -w "%{http_code}" "https://${DOMAIN}/health" --max-time 10 2>/dev/null || echo "000")
if [[ "${HTTPS_STATUS}" == "200" ]]; then
    ok "HTTPS – https://${DOMAIN}/health → 200"
    pass_check
else
    warn "HTTPS – https://${DOMAIN}/health → ${HTTPS_STATUS}"
    warn_check
fi

# SSL Certificate Expiry Check
CERT_EXPIRY=$(echo | openssl s_client -connect "${DOMAIN}:443" -servername "${DOMAIN}" 2>/dev/null \
    | openssl x509 -noout -enddate 2>/dev/null | cut -d= -f2 || echo "UNKNOWN")
EXPIRY_EPOCH=$(date -d "${CERT_EXPIRY}" +%s 2>/dev/null || echo 0)
NOW_EPOCH=$(date +%s)
DAYS_LEFT=$(( (EXPIRY_EPOCH - NOW_EPOCH) / 86400 ))

if [[ ${DAYS_LEFT} -gt 30 ]]; then
    ok "SSL Certificate – expires in ${DAYS_LEFT} days (${CERT_EXPIRY})"
    pass_check
elif [[ ${DAYS_LEFT} -gt 0 ]]; then
    warn "SSL Certificate – expires in ${DAYS_LEFT} days (renew soon!)"
    warn_check
else
    fail "SSL Certificate – expired or unknown"
    fail_check
fi

# Celery Worker
CELERY_PING=$(compose exec -T celery celery -A "${CELERY_APP:-celery_worker:celery_app}" inspect ping --timeout=5 2>/dev/null || echo "FAIL")
if echo "${CELERY_PING}" | grep -q "pong"; then
    ok "Celery Worker – pong received"
    pass_check
else
    fail "Celery Worker – not responding"
    fail_check
fi

echo ""

# ---------------------------------------------------------------------------
# Resource Usage
# ---------------------------------------------------------------------------
echo "Resource Usage Per Service:"
echo "────────────────────────────────────────────────────────────"

if command -v docker &> /dev/null; then
    docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.MemPerc}}" \
        $(compose ps -q 2>/dev/null) 2>/dev/null || true
else
    warn "Docker stats not available"
fi

echo ""

# ---------------------------------------------------------------------------
# Disk Usage
# ---------------------------------------------------------------------------
echo "Disk Usage (Docker volumes):"
echo "────────────────────────────────────────────────────────────"

# Overall disk space
AVAILABLE_SPACE=$(df "${DEPLOY_DIR}" | awk 'NR==2 {printf "%.1f", $4/(1024*1024)}')
TOTAL_SPACE=$(df "${DEPLOY_DIR}" | awk 'NR==2 {printf "%.1f", $2/(1024*1024)}')
USED_PERCENT=$(df "${DEPLOY_DIR}" | awk 'NR==2 {print $5}')

echo "  Host filesystem: ${USED_PERCENT} used (${AVAILABLE_SPACE}GB available of ${TOTAL_SPACE}GB total)"

if [[ "${DETAILED_MODE}" == "true" ]]; then
    if command -v docker &> /dev/null; then
        docker system df --verbose 2>/dev/null | grep "puraestate" || true
    fi
fi

echo ""

# ---------------------------------------------------------------------------
# Memory Usage Summary
# ---------------------------------------------------------------------------
echo "Memory Usage Summary:"
echo "────────────────────────────────────────────────────────────"

if command -v free &> /dev/null; then
    TOTAL_MEM=$(free -h | awk 'NR==2 {print $2}')
    USED_MEM=$(free -h | awk 'NR==2 {print $3}')
    AVAIL_MEM=$(free -h | awk 'NR==2 {print $7}')

    echo "  Total: ${TOTAL_MEM} | Used: ${USED_MEM} | Available: ${AVAIL_MEM}"
fi

echo ""

# ---------------------------------------------------------------------------
# Network Connectivity
# ---------------------------------------------------------------------------
if [[ "${DETAILED_MODE}" == "true" ]]; then
    echo "Network Connectivity:"
    echo "────────────────────────────────────────────────────────────"

    # Test DNS resolution
    if nslookup puraestate.com &>/dev/null 2>&1; then
        ok "DNS resolution working"
        pass_check
    else
        warn "DNS resolution may be impaired"
        warn_check
    fi

    # Test external connectivity
    if curl -s --max-time 5 https://www.google.com > /dev/null 2>&1; then
        ok "External internet connectivity available"
        pass_check
    else
        warn "External internet connectivity unavailable"
        warn_check
    fi

    echo ""
fi

# ---------------------------------------------------------------------------
# Summary Report
# ---------------------------------------------------------------------------
TOTAL_CHECKS=$((HEALTH_CHECKS_PASS + HEALTH_CHECKS_FAIL + HEALTH_CHECKS_WARN))

echo "============================================================"
echo "  Health Check Summary – $(date '+%Y-%m-%d %H:%M:%S')"
echo "============================================================"
echo ""
echo "  Total Checks:       ${TOTAL_CHECKS}"
echo "  Passed:             ${HEALTH_CHECKS_PASS}"
echo "  Failed:             ${HEALTH_CHECKS_FAIL}"
echo "  Warnings:           ${HEALTH_CHECKS_WARN}"
echo ""

if [[ ${HEALTH_CHECKS_FAIL} -eq 0 ]]; then
    echo -e "  ${GREEN}✓ Stack is healthy!${NC}"
else
    echo -e "  ${RED}✗ Stack has ${HEALTH_CHECKS_FAIL} health issue(s)!${NC}"
fi

echo ""
echo "  For detailed diagnostics:"
echo "    docker compose -f ${COMPOSE_FILE} logs -f [service_name]"
echo ""

if [[ ${HEALTH_CHECKS_FAIL} -eq 0 ]]; then
    exit 0
else
    exit 1
fi
