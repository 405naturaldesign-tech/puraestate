#!/usr/bin/env bash
# =============================================================================
# PuraEstate – Redis Initialization / Health Check Script
# =============================================================================
# Verifies Redis is running correctly and sets up any required keys/namespaces.
# Safe to run multiple times (idempotent).
#
# Usage:
#   ./scripts/redis-init.sh
# =============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEPLOY_DIR="$(dirname "$SCRIPT_DIR")"
ENV_FILE="${DEPLOY_DIR}/.env"

if [[ -f "${ENV_FILE}" ]]; then
    set -o allexport
    # shellcheck disable=SC1091
    source "${ENV_FILE}"
    set +o allexport
fi

log()  { echo "[$(date '+%Y-%m-%d %H:%M:%S')] INFO  $*"; }
warn() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] WARN  $*" >&2; }
err()  { echo "[$(date '+%Y-%m-%d %H:%M:%S')] ERROR $*" >&2; exit 1; }

REDIS_PASSWORD="${REDIS_PASSWORD:-}"
COMPOSE_FILE="${DEPLOY_DIR}/docker-compose.yml"

# ---------------------------------------------------------------------------
# Helper: run redis-cli inside the container
# ---------------------------------------------------------------------------
redis_cli() {
    docker compose -f "${COMPOSE_FILE}" --env-file "${ENV_FILE}" \
        exec -T redis redis-cli -a "${REDIS_PASSWORD}" "$@"
}

# ---------------------------------------------------------------------------
# 1. Ping Redis
# ---------------------------------------------------------------------------
log "Pinging Redis..."
PONG=$(redis_cli ping 2>/dev/null | tr -d '[:space:]')
[[ "${PONG}" == "PONG" ]] || err "Redis did not respond to PING. Check container status."
log "Redis is healthy."

# ---------------------------------------------------------------------------
# 2. Display server info
# ---------------------------------------------------------------------------
log "Redis server info:"
redis_cli info server | grep -E "^(redis_version|os|arch|uptime_in_seconds|tcp_port|config_file)"

# ---------------------------------------------------------------------------
# 3. Display memory info
# ---------------------------------------------------------------------------
log "Redis memory info:"
redis_cli info memory | grep -E "^(used_memory_human|used_memory_peak_human|maxmemory_human|maxmemory_policy)"

# ---------------------------------------------------------------------------
# 4. Verify keyspaces
# ---------------------------------------------------------------------------
log "Current keyspace:"
redis_cli info keyspace

# ---------------------------------------------------------------------------
# 5. Set a health-check sentinel key
# ---------------------------------------------------------------------------
log "Setting health sentinel key..."
redis_cli set "puraestate:health:initialized" "$(date -u +%Y-%m-%dT%H:%M:%SZ)" EX 86400 >/dev/null
log "Sentinel key set (TTL: 86400s)."

# ---------------------------------------------------------------------------
# 6. Database assignment summary
# ---------------------------------------------------------------------------
log "Database assignments:"
log "  DB 0  – Flask app cache (rate limiting, sessions, JWT blocklist)"
log "  DB 1  – Celery broker"
log "  DB 2  – Celery result backend"
log "  DB 15 – Test database (not used in production)"

# ---------------------------------------------------------------------------
# Summary
# ---------------------------------------------------------------------------
log "======================================================================"
log "Redis initialization complete."
log "======================================================================"
