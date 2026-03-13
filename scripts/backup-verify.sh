#!/bin/bash
# =============================================================================
# PuraEstate – Backup Verification & Test Restore Script
# =============================================================================
# Tests backup and restore procedures to ensure data integrity and
# recoverability. Creates a backup, verifies its integrity, performs
# a test restore to a separate database, and validates the restored data.
#
# Usage:
#   ./scripts/backup-verify.sh [--dry-run]
#
# Exit codes:
#   0 - Backup and restore verification successful
#   1 - Backup or restore verification failed
# =============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
ENV_FILE="${PROJECT_DIR}/.env"
DRY_RUN=false

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        *)
            shift
            ;;
    esac
done

# Load environment variables if .env exists
if [[ -f "${ENV_FILE}" ]]; then
    set -o allexport
    # shellcheck disable=SC1091
    source "${ENV_FILE}"
    set +o allexport
fi

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------
TIMESTAMP=$(date '+%Y%m%d_%H%M%S')
BACKUP_DIR="${PROJECT_DIR}/backups"
BACKUP_FILE="${BACKUP_DIR}/backup_${TIMESTAMP}.sql.gz"
TEST_DB_NAME="${POSTGRES_DB:-puraestate_prod}_test_${TIMESTAMP}"
POSTGRES_USER="${POSTGRES_USER:-puraestate}"
POSTGRES_PASSWORD="${POSTGRES_PASSWORD}"
POSTGRES_HOST="${POSTGRES_HOST:-localhost}"
POSTGRES_PORT="${POSTGRES_PORT:-5432}"
POSTGRES_DB="${POSTGRES_DB:-puraestate_prod}"

# Docker configuration
COMPOSE_FILE="${PROJECT_DIR}/docker/docker-compose.yml"
CONTAINER_NAME="puraestate-postgres"

# ---------------------------------------------------------------------------
# Colors and Output Functions
# ---------------------------------------------------------------------------
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

ok()    { echo -e "  ${GREEN}[PASS]${NC}  $*"; }
fail()  { echo -e "  ${RED}[FAIL]${NC}  $*"; }
warn()  { echo -e "  ${YELLOW}[WARN]${NC}  $*"; }
info()  { echo -e "  ${BLUE}[INFO]${NC}  $*"; }

# Test result tracking
TESTS_PASSED=0
TESTS_FAILED=0

test_pass() {
    ((TESTS_PASSED++))
}

test_fail() {
    ((TESTS_FAILED++))
}

# ---------------------------------------------------------------------------
# Header
# ---------------------------------------------------------------------------
echo ""
echo "============================================================"
echo "  PuraEstate Backup Verification & Test Restore"
echo "  Date: $(date '+%Y-%m-%d %H:%M:%S')"
if [[ "${DRY_RUN}" == "true" ]]; then
    echo "  Mode: DRY RUN (no changes)"
fi
echo "============================================================"
echo ""

# ---------------------------------------------------------------------------
# Pre-flight Checks
# ---------------------------------------------------------------------------
echo "Pre-flight Checks"
echo "   ────────────────────────────────────────────────────────"

# Check required commands
if ! command -v docker &> /dev/null; then
    fail "Docker is not installed"
    test_fail
    exit 1
fi
ok "Docker is available"
test_pass

if ! command -v gzip &> /dev/null; then
    fail "gzip is not installed"
    test_fail
    exit 1
fi
ok "gzip is available"
test_pass

# Check PostgreSQL container is running
if docker ps | grep -q "${CONTAINER_NAME}"; then
    ok "PostgreSQL container is running (${CONTAINER_NAME})"
    test_pass
else
    fail "PostgreSQL container is not running"
    test_fail
    echo ""
    echo "Start the container with:"
    echo "  docker compose -f ${COMPOSE_FILE} up -d postgres"
    exit 1
fi

# Create backup directory
if [[ ! -d "${BACKUP_DIR}" ]]; then
    if [[ "${DRY_RUN}" == "true" ]]; then
        info "Would create backup directory: ${BACKUP_DIR}"
    else
        mkdir -p "${BACKUP_DIR}"
        ok "Created backup directory: ${BACKUP_DIR}"
        test_pass
    fi
else
    ok "Backup directory exists: ${BACKUP_DIR}"
    test_pass
fi

echo ""

# ---------------------------------------------------------------------------
# 1. Create Database Backup
# ---------------------------------------------------------------------------
echo "1. Creating Database Backup"
echo "   ────────────────────────────────────────────────────────"

if [[ "${DRY_RUN}" == "true" ]]; then
    info "Would create backup: ${BACKUP_FILE}"
    TESTS_PASSED=$((TESTS_PASSED + 1))
else
    info "Backing up database: ${POSTGRES_DB}"
    info "Output file: ${BACKUP_FILE}"

    # Create the backup using docker exec
    if docker exec "${CONTAINER_NAME}" \
        pg_dump -U "${POSTGRES_USER}" "${POSTGRES_DB}" | \
        gzip > "${BACKUP_FILE}"; then

        BACKUP_SIZE=$(du -h "${BACKUP_FILE}" | cut -f1)
        ok "Backup created successfully (${BACKUP_SIZE})"
        test_pass
    else
        fail "Failed to create backup"
        test_fail
        exit 1
    fi
fi

echo ""

# ---------------------------------------------------------------------------
# 2. Verify Backup Integrity
# ---------------------------------------------------------------------------
echo "2. Verifying Backup Integrity"
echo "   ────────────────────────────────────────────────────────"

if [[ "${DRY_RUN}" == "true" ]]; then
    info "Would verify backup integrity"
    TESTS_PASSED=$((TESTS_PASSED + 1))
else
    if [[ -f "${BACKUP_FILE}" ]]; then
        # Test gzip integrity
        if gzip -t "${BACKUP_FILE}" 2>/dev/null; then
            ok "Backup file integrity verified (valid gzip)"
            test_pass
        else
            fail "Backup file is corrupted (invalid gzip)"
            test_fail
            exit 1
        fi

        # Test that backup contains valid SQL
        if gzip -dc "${BACKUP_FILE}" | head -n 100 | grep -q "PostgreSQL"; then
            ok "Backup contains valid PostgreSQL dump"
            test_pass
        else
            warn "Could not verify backup content is valid SQL"
        fi

        # Check backup size
        BACKUP_SIZE_BYTES=$(stat -f%z "${BACKUP_FILE}" 2>/dev/null || stat -c%s "${BACKUP_FILE}" 2>/dev/null || echo 0)
        if [[ ${BACKUP_SIZE_BYTES} -lt 1000 ]]; then
            fail "Backup file is suspiciously small (${BACKUP_SIZE_BYTES} bytes)"
            test_fail
        else
            BACKUP_SIZE=$(numfmt --to=iec-i --suffix=B ${BACKUP_SIZE_BYTES} 2>/dev/null || echo "${BACKUP_SIZE_BYTES} bytes")
            ok "Backup size is reasonable (${BACKUP_SIZE})"
            test_pass
        fi
    else
        fail "Backup file not found: ${BACKUP_FILE}"
        test_fail
        exit 1
    fi
fi

echo ""

# ---------------------------------------------------------------------------
# 3. Create Test Database
# ---------------------------------------------------------------------------
echo "3. Creating Test Database"
echo "   ────────────────────────────────────────────────────────"

if [[ "${DRY_RUN}" == "true" ]]; then
    info "Would create test database: ${TEST_DB_NAME}"
    TESTS_PASSED=$((TESTS_PASSED + 1))
else
    info "Creating test database: ${TEST_DB_NAME}"

    # Create test database
    if docker exec "${CONTAINER_NAME}" \
        createdb -U "${POSTGRES_USER}" "${TEST_DB_NAME}" 2>/dev/null; then
        ok "Test database created: ${TEST_DB_NAME}"
        test_pass
    else
        fail "Failed to create test database"
        test_fail
        exit 1
    fi
fi

echo ""

# ---------------------------------------------------------------------------
# 4. Restore Backup to Test Database
# ---------------------------------------------------------------------------
echo "4. Restoring Backup to Test Database"
echo "   ────────────────────────────────────────────────────────"

if [[ "${DRY_RUN}" == "true" ]]; then
    info "Would restore backup to: ${TEST_DB_NAME}"
    TESTS_PASSED=$((TESTS_PASSED + 1))
else
    info "Restoring backup to test database..."

    # Restore the backup
    if gzip -dc "${BACKUP_FILE}" | \
        docker exec -i "${CONTAINER_NAME}" \
        psql -U "${POSTGRES_USER}" "${TEST_DB_NAME}" > /dev/null 2>&1; then
        ok "Backup restored to test database"
        test_pass
    else
        fail "Failed to restore backup"
        test_fail

        # Clean up test database
        docker exec "${CONTAINER_NAME}" \
            dropdb -U "${POSTGRES_USER}" "${TEST_DB_NAME}" 2>/dev/null || true

        exit 1
    fi
fi

echo ""

# ---------------------------------------------------------------------------
# 5. Validate Restored Data
# ---------------------------------------------------------------------------
echo "5. Validating Restored Data"
echo "   ────────────────────────────────────────────────────────"

if [[ "${DRY_RUN}" == "true" ]]; then
    info "Would validate restored data"
    TESTS_PASSED=$((TESTS_PASSED + 1))
else
    # Count tables in restored database
    TABLE_COUNT=$(docker exec "${CONTAINER_NAME}" \
        psql -U "${POSTGRES_USER}" "${TEST_DB_NAME}" -c \
        "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public';" 2>/dev/null | grep -o '^[[:space:]]*[0-9]' | tr -d ' ' || echo "0")

    if [[ -n "${TABLE_COUNT}" && "${TABLE_COUNT}" -gt 0 ]]; then
        ok "Restored database contains ${TABLE_COUNT} tables"
        test_pass
    else
        warn "Could not verify table count in restored database"
    fi

    # Get row count in a sample table (if it exists)
    SAMPLE_QUERY=$(docker exec "${CONTAINER_NAME}" \
        psql -U "${POSTGRES_USER}" "${TEST_DB_NAME}" -c \
        "SELECT COUNT(*) FROM pg_tables WHERE schemaname='public' LIMIT 1;" 2>/dev/null || echo "")

    if [[ -n "${SAMPLE_QUERY}" ]]; then
        ok "Test database is accessible and responsive"
        test_pass
    else
        warn "Could not verify test database connectivity"
    fi

    # Check database size
    DB_SIZE=$(docker exec "${CONTAINER_NAME}" \
        psql -U "${POSTGRES_USER}" "${TEST_DB_NAME}" -c \
        "SELECT pg_size_pretty(pg_database_size('${TEST_DB_NAME}'));" 2>/dev/null | grep -oE '[0-9.]+ [KMGT]B' | head -1 || echo "unknown")

    ok "Test database size: ${DB_SIZE}"
    test_pass
fi

echo ""

# ---------------------------------------------------------------------------
# 6. Cleanup Test Database
# ---------------------------------------------------------------------------
echo "6. Cleaning Up Test Resources"
echo "   ────────────────────────────────────────────────────────"

if [[ "${DRY_RUN}" == "true" ]]; then
    info "Would drop test database: ${TEST_DB_NAME}"
    TESTS_PASSED=$((TESTS_PASSED + 1))
else
    # Drop test database
    if docker exec "${CONTAINER_NAME}" \
        dropdb -U "${POSTGRES_USER}" "${TEST_DB_NAME}" 2>/dev/null; then
        ok "Test database dropped: ${TEST_DB_NAME}"
        test_pass
    else
        warn "Failed to drop test database (may need manual cleanup)"
    fi
fi

echo ""

# ---------------------------------------------------------------------------
# Summary Report
# ---------------------------------------------------------------------------
TOTAL_TESTS=$((TESTS_PASSED + TESTS_FAILED))

echo "============================================================"
echo "  Verification Summary"
echo "============================================================"
echo ""
echo "  Total Tests:        ${TOTAL_TESTS}"
echo "  Passed:             ${TESTS_PASSED}"
echo "  Failed:             ${TESTS_FAILED}"
echo ""

if [[ ${TESTS_FAILED} -eq 0 ]]; then
    echo -e "  ${GREEN}✓ Backup verification successful!${NC}"
    echo ""
    if [[ "${DRY_RUN}" == "false" ]]; then
        echo "  Backup Location: ${BACKUP_FILE}"
        echo "  Backup Size: $(du -h "${BACKUP_FILE}" | cut -f1)"
        echo ""
        echo "  To manually restore this backup in the future:"
        echo "    gunzip -c ${BACKUP_FILE} | docker exec -i ${CONTAINER_NAME} psql -U ${POSTGRES_USER} ${POSTGRES_DB}"
        echo ""
    fi
    exit 0
else
    echo -e "  ${RED}✗ Backup verification failed!${NC}"
    echo ""
    exit 1
fi
