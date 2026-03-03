#!/usr/bin/env bash
# =============================================================================
# PuraEstate – Database Migration Runner
# =============================================================================
# Runs Flask-Migrate / Alembic migrations inside the running Flask container
# (or a one-off container if the stack is not yet up).
#
# Usage:
#   # Run pending migrations (most common case)
#   ./scripts/db-migrate.sh upgrade
#
#   # Check current revision
#   ./scripts/db-migrate.sh current
#
#   # Show migration history
#   ./scripts/db-migrate.sh history
#
#   # Create a new migration (dev only)
#   ./scripts/db-migrate.sh generate "add_property_views_table"
#
#   # Downgrade one revision
#   ./scripts/db-migrate.sh downgrade -1
# =============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEPLOY_DIR="$(dirname "$SCRIPT_DIR")"
COMPOSE_FILE="${DEPLOY_DIR}/docker-compose.yml"
ENV_FILE="${DEPLOY_DIR}/.env"

# ---------------------------------------------------------------------------
# Load env
# ---------------------------------------------------------------------------
if [[ -f "${ENV_FILE}" ]]; then
    set -o allexport
    # shellcheck disable=SC1091
    source "${ENV_FILE}"
    set +o allexport
fi

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
log()  { echo "[$(date '+%Y-%m-%d %H:%M:%S')] INFO  $*"; }
err()  { echo "[$(date '+%Y-%m-%d %H:%M:%S')] ERROR $*" >&2; exit 1; }

COMMAND="${1:-upgrade}"
shift || true
EXTRA_ARGS="$*"

# ---------------------------------------------------------------------------
# Ensure postgres is healthy before running migrations
# ---------------------------------------------------------------------------
log "Checking PostgreSQL availability..."
docker compose -f "${COMPOSE_FILE}" --env-file "${ENV_FILE}" \
    exec -T postgres pg_isready -U "${POSTGRES_USER:-puraestate}" \
    || err "PostgreSQL is not ready. Start the stack first: docker compose up -d postgres"

# ---------------------------------------------------------------------------
# Run the migration command in the flask container
# ---------------------------------------------------------------------------
case "${COMMAND}" in
    upgrade)
        log "Running: flask db upgrade head"
        docker compose -f "${COMPOSE_FILE}" --env-file "${ENV_FILE}" \
            exec -T flask flask db upgrade head
        log "Migration complete."
        ;;

    downgrade)
        REVISION="${EXTRA_ARGS:--1}"
        log "Running: flask db downgrade ${REVISION}"
        docker compose -f "${COMPOSE_FILE}" --env-file "${ENV_FILE}" \
            exec -T flask flask db downgrade "${REVISION}"
        log "Downgrade complete."
        ;;

    current)
        log "Running: flask db current"
        docker compose -f "${COMPOSE_FILE}" --env-file "${ENV_FILE}" \
            exec -T flask flask db current
        ;;

    history)
        log "Running: flask db history"
        docker compose -f "${COMPOSE_FILE}" --env-file "${ENV_FILE}" \
            exec -T flask flask db history --verbose
        ;;

    generate)
        MESSAGE="${EXTRA_ARGS:-auto_migration}"
        log "Running: flask db migrate -m '${MESSAGE}'"
        docker compose -f "${COMPOSE_FILE}" --env-file "${ENV_FILE}" \
            exec -T flask flask db migrate -m "${MESSAGE}"
        log "Migration script generated. Review it before committing."
        ;;

    stamp)
        REVISION="${EXTRA_ARGS:-head}"
        log "Running: flask db stamp ${REVISION}"
        docker compose -f "${COMPOSE_FILE}" --env-file "${ENV_FILE}" \
            exec -T flask flask db stamp "${REVISION}"
        ;;

    show)
        log "Running: flask db show"
        docker compose -f "${COMPOSE_FILE}" --env-file "${ENV_FILE}" \
            exec -T flask flask db show
        ;;

    *)
        echo "Usage: $0 {upgrade|downgrade|current|history|generate|stamp|show} [args]"
        exit 1
        ;;
esac
