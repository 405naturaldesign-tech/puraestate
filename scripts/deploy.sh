#!/usr/bin/env bash
# =============================================================================
# PuraEstate – Production Deployment Script
# =============================================================================
# Performs a zero-downtime rolling update of the PuraEstate stack.
#
# Usage:
#   ./scripts/deploy.sh [--version TAG] [--skip-build] [--skip-migrate]
#
# Examples:
#   ./scripts/deploy.sh                      # build from source, run migrations
#   ./scripts/deploy.sh --version 1.2.3      # deploy a specific tagged image
#   ./scripts/deploy.sh --skip-migrate       # skip running migrations
# =============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEPLOY_DIR="$(dirname "$SCRIPT_DIR")"
COMPOSE_FILE="${DEPLOY_DIR}/docker-compose.yml"
ENV_FILE="${DEPLOY_DIR}/.env"
LOG_FILE="/var/log/puraestate/deploy-$(date +%Y%m%d-%H%M%S).log"

# Ensure log directory exists
mkdir -p /var/log/puraestate

# Tee all output to log file
exec > >(tee -a "${LOG_FILE}") 2>&1

# ---------------------------------------------------------------------------
# Default flags
# ---------------------------------------------------------------------------
SKIP_BUILD=false
SKIP_MIGRATE=false
APP_VERSION=""

# ---------------------------------------------------------------------------
# Parse arguments
# ---------------------------------------------------------------------------
while [[ $# -gt 0 ]]; do
    case "$1" in
        --version)
            APP_VERSION="$2"
            shift 2
            ;;
        --skip-build)
            SKIP_BUILD=true
            shift
            ;;
        --skip-migrate)
            SKIP_MIGRATE=true
            shift
            ;;
        *)
            echo "Unknown argument: $1"
            echo "Usage: $0 [--version TAG] [--skip-build] [--skip-migrate]"
            exit 1
            ;;
    esac
done

# ---------------------------------------------------------------------------
# Load environment
# ---------------------------------------------------------------------------
if [[ -f "${ENV_FILE}" ]]; then
    set -o allexport
    # shellcheck disable=SC1091
    source "${ENV_FILE}"
    set +o allexport
else
    echo "ERROR: .env not found at ${ENV_FILE}" >&2
    exit 1
fi

[[ -n "${APP_VERSION}" ]] && export APP_VERSION

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
log()     { echo "[$(date '+%Y-%m-%d %H:%M:%S')] INFO  $*"; }
log_ok()  { echo "[$(date '+%Y-%m-%d %H:%M:%S')] OK    $*"; }
warn()    { echo "[$(date '+%Y-%m-%d %H:%M:%S')] WARN  $*" >&2; }
err()     { echo "[$(date '+%Y-%m-%d %H:%M:%S')] ERROR $*" >&2; exit 1; }

compose() {
    docker compose -f "${COMPOSE_FILE}" --env-file "${ENV_FILE}" "$@"
}

# ---------------------------------------------------------------------------
# Pre-flight checks
# ---------------------------------------------------------------------------
log "======================================================================"
log "PuraEstate Deployment – $(date '+%Y-%m-%d %H:%M:%S %Z')"
log "  Version   : ${APP_VERSION:-latest (built from source)}"
log "  Skip build: ${SKIP_BUILD}"
log "  Skip mig. : ${SKIP_MIGRATE}"
log "  Log file  : ${LOG_FILE}"
log "======================================================================"

log "Running pre-flight checks..."

# Check Docker
docker info >/dev/null 2>&1 || err "Docker daemon is not running."

# Check .env has no CHANGE_ME placeholders
if grep -q "CHANGE_ME" "${ENV_FILE}"; then
    err ".env contains CHANGE_ME placeholder values. Fill in all secrets first."
fi

log "Pre-flight checks passed."

# ---------------------------------------------------------------------------
# 1. Build images
# ---------------------------------------------------------------------------
if [[ "${SKIP_BUILD}" == false ]]; then
    log "Building Docker images..."
    compose build --parallel --no-cache flask frontend celery
    log_ok "Images built."
fi

# ---------------------------------------------------------------------------
# 2. Pull base images (for databases, redis, nginx)
# ---------------------------------------------------------------------------
log "Pulling latest base images..."
compose pull postgres redis 2>/dev/null || warn "Some base images could not be pulled."

# ---------------------------------------------------------------------------
# 3. Start / restart infrastructure (postgres, redis)
# ---------------------------------------------------------------------------
log "Starting infrastructure services (postgres, redis)..."
compose up -d --no-recreate postgres redis
log "Waiting for PostgreSQL to be healthy..."
timeout 60 bash -c "until compose exec -T postgres pg_isready -U ${POSTGRES_USER} 2>/dev/null; do sleep 2; done"
log_ok "PostgreSQL is healthy."

log "Waiting for Redis to be healthy..."
timeout 30 bash -c "until compose exec -T redis redis-cli -a \"${REDIS_PASSWORD}\" ping 2>/dev/null | grep -q PONG; do sleep 2; done"
log_ok "Redis is healthy."

# ---------------------------------------------------------------------------
# 4. Run database migrations
# ---------------------------------------------------------------------------
if [[ "${SKIP_MIGRATE}" == false ]]; then
    log "Running database migrations..."
    compose run --rm \
        -e FLASK_ENV=production \
        flask flask db upgrade head
    log_ok "Migrations complete."
fi

# ---------------------------------------------------------------------------
# 5. Rolling restart of application services
# ---------------------------------------------------------------------------
log "Starting/updating Flask API..."
compose up -d --no-deps flask
log "Waiting for Flask to be healthy..."
timeout 90 bash -c "until compose exec -T flask curl -sf http://localhost:5000/health 2>/dev/null; do sleep 3; done"
log_ok "Flask API is healthy."

log "Starting/updating Next.js frontend..."
compose up -d --no-deps frontend
log "Waiting for Next.js to be healthy..."
timeout 90 bash -c "until compose exec -T frontend curl -sf http://localhost:3000/ 2>/dev/null; do sleep 3; done"
log_ok "Next.js frontend is healthy."

log "Starting/updating Celery worker..."
compose up -d --no-deps celery
log_ok "Celery worker started."

log "Reloading Nginx..."
compose up -d --no-deps nginx
compose exec -T nginx nginx -t && compose exec -T nginx nginx -s reload
log_ok "Nginx reloaded."

# ---------------------------------------------------------------------------
# 6. Smoke test
# ---------------------------------------------------------------------------
log "Running smoke tests..."

DOMAIN="${DOMAIN:-puraestate.com}"
sleep 5

# Test HTTPS
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "https://${DOMAIN}/health" --max-time 10 || echo "000")
if [[ "${HTTP_STATUS}" == "200" ]]; then
    log_ok "Health endpoint returned HTTP 200."
else
    warn "Health endpoint returned HTTP ${HTTP_STATUS}. Check logs."
fi

# Test API root
API_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "https://${DOMAIN}/api/v1" --max-time 10 || echo "000")
if [[ "${API_STATUS}" == "200" ]]; then
    log_ok "API root returned HTTP 200."
else
    warn "API root returned HTTP ${API_STATUS}."
fi

# ---------------------------------------------------------------------------
# 7. Clean up old images
# ---------------------------------------------------------------------------
log "Cleaning up dangling Docker images..."
docker image prune -f >/dev/null 2>&1 || true

# ---------------------------------------------------------------------------
# Summary
# ---------------------------------------------------------------------------
log "======================================================================"
log_ok "Deployment complete!"
log ""
log "  Site     : https://${DOMAIN}"
log "  API      : https://${DOMAIN}/api/v1"
log "  Health   : https://${DOMAIN}/health"
log "  Log file : ${LOG_FILE}"
log ""
log "Monitor with:"
log "  docker compose -f ${COMPOSE_FILE} logs -f --tail=100"
log "======================================================================"
