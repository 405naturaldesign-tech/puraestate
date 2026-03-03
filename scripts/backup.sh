#!/usr/bin/env bash
# =============================================================================
# PuraEstate – Backup Script
# =============================================================================
# Backs up PostgreSQL database and Redis data to a local directory,
# then optionally uploads to AWS S3.
#
# Schedule via cron (example – daily at 2:00 AM):
#   0 2 * * * /home/deploy/puraestate/deploy/scripts/backup.sh >> /var/log/puraestate/backup.log 2>&1
#
# Usage:
#   ./scripts/backup.sh [--s3] [--retention-days 30]
# =============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEPLOY_DIR="$(dirname "$SCRIPT_DIR")"
ENV_FILE="${DEPLOY_DIR}/.env"
COMPOSE_FILE="${DEPLOY_DIR}/docker-compose.yml"

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
# Configuration
# ---------------------------------------------------------------------------
BACKUP_DIR="${BACKUP_DIR:-/var/backups/puraestate}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"
UPLOAD_S3=false
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
BACKUP_PREFIX="puraestate-backup-${TIMESTAMP}"

# ---------------------------------------------------------------------------
# Parse arguments
# ---------------------------------------------------------------------------
while [[ $# -gt 0 ]]; do
    case "$1" in
        --s3) UPLOAD_S3=true; shift ;;
        --retention-days) RETENTION_DAYS="$2"; shift 2 ;;
        *) echo "Unknown arg: $1"; exit 1 ;;
    esac
done

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
log()    { echo "[$(date '+%Y-%m-%d %H:%M:%S')] INFO  $*"; }
log_ok() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] OK    $*"; }
err()    { echo "[$(date '+%Y-%m-%d %H:%M:%S')] ERROR $*" >&2; exit 1; }

compose() {
    docker compose -f "${COMPOSE_FILE}" --env-file "${ENV_FILE}" "$@"
}

# ---------------------------------------------------------------------------
# Prepare backup directory
# ---------------------------------------------------------------------------
mkdir -p "${BACKUP_DIR}"
BACKUP_PATH="${BACKUP_DIR}/${BACKUP_PREFIX}"
mkdir -p "${BACKUP_PATH}"

log "======================================================================"
log "PuraEstate Backup – ${TIMESTAMP}"
log "  Destination : ${BACKUP_PATH}"
log "  Retention   : ${RETENTION_DAYS} days"
log "  S3 upload   : ${UPLOAD_S3}"
log "======================================================================"

# ---------------------------------------------------------------------------
# 1. PostgreSQL dump
# ---------------------------------------------------------------------------
log "Dumping PostgreSQL database..."
PG_DUMP_FILE="${BACKUP_PATH}/postgres-${TIMESTAMP}.sql.gz"

compose exec -T postgres pg_dump \
    -U "${POSTGRES_USER}" \
    -d "${POSTGRES_DB}" \
    --no-owner \
    --no-acl \
    --verbose \
    | gzip -9 > "${PG_DUMP_FILE}"

PG_SIZE=$(du -sh "${PG_DUMP_FILE}" | cut -f1)
log_ok "PostgreSQL dump complete: ${PG_DUMP_FILE} (${PG_SIZE})"

# ---------------------------------------------------------------------------
# 2. Redis RDB backup (BGSAVE + copy)
# ---------------------------------------------------------------------------
log "Backing up Redis data..."
REDIS_BACKUP_FILE="${BACKUP_PATH}/redis-${TIMESTAMP}.rdb.gz"

# Trigger a BGSAVE and wait for it to complete
compose exec -T redis redis-cli -a "${REDIS_PASSWORD}" BGSAVE
sleep 5  # Allow time for BGSAVE to complete

# Copy the RDB file from the redis container
REDIS_CONTAINER=$(compose ps -q redis)
docker cp "${REDIS_CONTAINER}:/data/dump.rdb" "/tmp/redis-dump-${TIMESTAMP}.rdb"
gzip -9 "/tmp/redis-dump-${TIMESTAMP}.rdb"
mv "/tmp/redis-dump-${TIMESTAMP}.rdb.gz" "${REDIS_BACKUP_FILE}"

REDIS_SIZE=$(du -sh "${REDIS_BACKUP_FILE}" | cut -f1)
log_ok "Redis backup complete: ${REDIS_BACKUP_FILE} (${REDIS_SIZE})"

# ---------------------------------------------------------------------------
# 3. Create a manifest file
# ---------------------------------------------------------------------------
MANIFEST_FILE="${BACKUP_PATH}/manifest.txt"
cat > "${MANIFEST_FILE}" <<MANIFEST
PuraEstate Backup Manifest
==========================
Timestamp  : ${TIMESTAMP}
Domain     : ${DOMAIN:-puraestate.com}
App version: ${APP_VERSION:-unknown}

Files:
  $(basename "${PG_DUMP_FILE}")  (${PG_SIZE})
  $(basename "${REDIS_BACKUP_FILE}")  (${REDIS_SIZE})

PostgreSQL:
  Database : ${POSTGRES_DB}
  User     : ${POSTGRES_USER}

Restore commands:
  PostgreSQL:
    gunzip -c postgres-${TIMESTAMP}.sql.gz | docker compose exec -T postgres psql -U ${POSTGRES_USER} ${POSTGRES_DB}

  Redis:
    gunzip -k redis-${TIMESTAMP}.rdb.gz
    docker cp redis-${TIMESTAMP}.rdb puraestate-redis:/data/dump.rdb
    docker compose restart redis
MANIFEST

log_ok "Manifest written to ${MANIFEST_FILE}"

# ---------------------------------------------------------------------------
# 4. Create a tarball of the entire backup
# ---------------------------------------------------------------------------
TARBALL="${BACKUP_DIR}/${BACKUP_PREFIX}.tar.gz"
tar -czf "${TARBALL}" -C "${BACKUP_DIR}" "${BACKUP_PREFIX}/"
TOTAL_SIZE=$(du -sh "${TARBALL}" | cut -f1)
rm -rf "${BACKUP_PATH}"
log_ok "Backup archive created: ${TARBALL} (${TOTAL_SIZE})"

# ---------------------------------------------------------------------------
# 5. Upload to S3 (optional)
# ---------------------------------------------------------------------------
if [[ "${UPLOAD_S3}" == true ]]; then
    if [[ -z "${AWS_S3_BUCKET:-}" ]]; then
        err "AWS_S3_BUCKET is not set. Cannot upload to S3."
    fi

    S3_KEY="backups/$(date +%Y/%m)/$(basename "${TARBALL}")"
    log "Uploading to s3://${AWS_S3_BUCKET}/${S3_KEY}..."

    aws s3 cp "${TARBALL}" "s3://${AWS_S3_BUCKET}/${S3_KEY}" \
        --storage-class STANDARD_IA \
        --metadata "domain=${DOMAIN:-puraestate.com},version=${APP_VERSION:-unknown}" \
        --region "${AWS_REGION:-us-east-1}"

    log_ok "Uploaded to s3://${AWS_S3_BUCKET}/${S3_KEY}"
fi

# ---------------------------------------------------------------------------
# 6. Clean up old backups
# ---------------------------------------------------------------------------
log "Removing backups older than ${RETENTION_DAYS} days..."
find "${BACKUP_DIR}" -name "puraestate-backup-*.tar.gz" \
    -mtime "+${RETENTION_DAYS}" -delete -print | \
    while read -r f; do log "Deleted old backup: $f"; done

# ---------------------------------------------------------------------------
# Summary
# ---------------------------------------------------------------------------
log "======================================================================"
log_ok "Backup complete!"
log "  Archive: ${TARBALL} (${TOTAL_SIZE})"
log "======================================================================"
