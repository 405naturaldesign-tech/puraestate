#!/bin/bash
# =============================================================================
# PuraEstate – Pre-Deployment Validation Script
# =============================================================================
# Comprehensive pre-deployment checklist that verifies all requirements
# before deploying to production or staging environments.
#
# Includes:
#   - Environment variables validation
#   - Database migrations status
#   - Secrets configuration
#   - External service connectivity
#   - SSL certificate validity
#   - Disk space availability
#   - Docker image build status
#   - Type checking
#   - Linting
#   - Unit tests
#
# Usage:
#   ./scripts/pre-deploy-validation.sh [dev|staging|production]
#
# Exit codes:
#   0 - All validations pass
#   1 - One or more validations fail
# =============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
ENVIRONMENT="${1:-production}"
ENV_FILE="${PROJECT_DIR}/.env"

# Load environment variables if .env exists
if [[ -f "${ENV_FILE}" ]]; then
    set -o allexport
    # shellcheck disable=SC1091
    source "${ENV_FILE}"
    set +o allexport
fi

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
CHECKS_PASSED=0
CHECKS_FAILED=0
CHECKS_WARNING=0

check_pass() {
    ((CHECKS_PASSED++))
}

check_fail() {
    ((CHECKS_FAILED++))
}

check_warn() {
    ((CHECKS_WARNING++))
}

# ---------------------------------------------------------------------------
# Header
# ---------------------------------------------------------------------------
echo ""
echo "============================================================"
echo "  PuraEstate Pre-Deployment Validation"
echo "  Environment: ${ENVIRONMENT}"
echo "  Date: $(date '+%Y-%m-%d %H:%M:%S')"
echo "============================================================"
echo ""

# ---------------------------------------------------------------------------
# 1. Environment Variables Validation
# ---------------------------------------------------------------------------
echo "1. Environment Variables Validation"
echo "   ────────────────────────────────────────────────────────"

REQUIRED_VARS=(
    "POSTGRES_USER"
    "POSTGRES_PASSWORD"
    "POSTGRES_DB"
    "REDIS_PASSWORD"
    "SECRET_KEY"
    "JWT_SECRET_KEY"
)

for var in "${REQUIRED_VARS[@]}"; do
    if [[ -n "${!var:-}" ]]; then
        ok "Required variable set: ${var}"
        check_pass
    else
        fail "Missing required variable: ${var}"
        check_fail
    fi
done

# Environment-specific variable checks
if [[ "${ENVIRONMENT}" == "production" ]]; then
    PROD_VARS=(
        "STRIPE_SECRET_KEY"
        "SENDGRID_API_KEY"
        "AWS_ACCESS_KEY_ID"
        "AWS_SECRET_ACCESS_KEY"
        "AWS_S3_BUCKET"
    )

    for var in "${PROD_VARS[@]}"; do
        if [[ -n "${!var:-}" ]]; then
            ok "Production variable set: ${var}"
            check_pass
        else
            fail "Missing production variable: ${var}"
            check_fail
        fi
    done
fi

echo ""

# ---------------------------------------------------------------------------
# 2. Secrets Configuration Check
# ---------------------------------------------------------------------------
echo "2. Secrets Configuration Check"
echo "   ────────────────────────────────────────────────────────"

# Check that no example/placeholder values are in use
PLACEHOLDER_VARS=(
    "POSTGRES_PASSWORD:YOUR_PASSWORD"
    "SECRET_KEY:YOUR_SECRET"
    "JWT_SECRET_KEY:YOUR_SECRET"
)

for check in "${PLACEHOLDER_VARS[@]}"; do
    var_name="${check%%:*}"
    placeholder="${check##*:}"

    var_value="${!var_name:-}"
    if [[ -z "${var_value}" ]]; then
        warn "Variable not set: ${var_name}"
        check_warn
    elif [[ "${var_value}" == "${placeholder}"* ]] || [[ "${var_value}" == "YOUR_"* ]]; then
        fail "Placeholder value detected in ${var_name}"
        check_fail
    else
        ok "Secret properly configured: ${var_name}"
        check_pass
    fi
done

echo ""

# ---------------------------------------------------------------------------
# 3. Docker Compose Validation
# ---------------------------------------------------------------------------
echo "3. Docker Compose Configuration"
echo "   ────────────────────────────────────────────────────────"

COMPOSE_FILE="${PROJECT_DIR}/docker/docker-compose.yml"

if [[ -f "${COMPOSE_FILE}" ]]; then
    ok "Docker Compose file found: ${COMPOSE_FILE}"
    check_pass

    # Validate docker-compose syntax
    if command -v docker &> /dev/null; then
        if docker compose -f "${COMPOSE_FILE}" config > /dev/null 2>&1; then
            ok "Docker Compose configuration is valid"
            check_pass
        else
            fail "Docker Compose configuration is invalid"
            check_fail
        fi
    else
        warn "Docker not available, skipping Docker Compose validation"
        check_warn
    fi
else
    fail "Docker Compose file not found: ${COMPOSE_FILE}"
    check_fail
fi

echo ""

# ---------------------------------------------------------------------------
# 4. Docker Image Build Status
# ---------------------------------------------------------------------------
echo "4. Docker Image Build Status"
echo "   ────────────────────────────────────────────────────────"

if command -v docker &> /dev/null; then
    # Check for required Docker images
    REQUIRED_IMAGES=(
        "puraestate/flask-api"
        "puraestate/frontend"
        "puraestate/nginx"
        "puraestate/celery-worker"
    )

    for image in "${REQUIRED_IMAGES[@]}"; do
        if docker images | grep -q "^${image} "; then
            ok "Docker image available: ${image}"
            check_pass
        else
            warn "Docker image not built yet: ${image}"
            warn "  Run: docker compose -f docker/docker-compose.yml build"
            check_warn
        fi
    done
else
    warn "Docker not available, skipping image check"
    check_warn
fi

echo ""

# ---------------------------------------------------------------------------
# 5. Type Checking (TypeScript/ESLint)
# ---------------------------------------------------------------------------
echo "5. Type Checking"
echo "   ────────────────────────────────────────────────────────"

if [[ -f "${PROJECT_DIR}/tsconfig.json" ]]; then
    ok "TypeScript configuration found"
    check_pass

    if command -v npm &> /dev/null; then
        if npm run --silent type-check > /dev/null 2>&1; then
            ok "Type checking passed"
            check_pass
        else
            fail "Type checking failed - fix TypeScript errors before deploying"
            check_fail
        fi
    else
        warn "npm not available, skipping type checking"
        check_warn
    fi
else
    info "TypeScript not configured"
fi

echo ""

# ---------------------------------------------------------------------------
# 6. Linting
# ---------------------------------------------------------------------------
echo "6. Code Linting"
echo "   ────────────────────────────────────────────────────────"

if [[ -f "${PROJECT_DIR}/.eslintrc.json" ]]; then
    ok "ESLint configuration found"
    check_pass

    if command -v npm &> /dev/null; then
        if npm run --silent lint > /dev/null 2>&1; then
            ok "Linting passed"
            check_pass
        else
            fail "Linting failed - fix ESLint errors before deploying"
            check_fail
        fi
    else
        warn "npm not available, skipping linting"
        check_warn
    fi
else
    info "ESLint not configured"
fi

echo ""

# ---------------------------------------------------------------------------
# 7. Unit Tests
# ---------------------------------------------------------------------------
echo "7. Unit Tests"
echo "   ────────────────────────────────────────────────────────"

if [[ -f "${PROJECT_DIR}/jest.config.js" ]] || [[ -f "${PROJECT_DIR}/package.json" ]]; then
    ok "Test configuration found"
    check_pass

    if command -v npm &> /dev/null; then
        # Check if test script exists in package.json
        if grep -q '"test"' "${PROJECT_DIR}/package.json"; then
            if npm test -- --passWithNoTests > /dev/null 2>&1; then
                ok "Unit tests passed"
                check_pass
            else
                fail "Unit tests failed - fix failing tests before deploying"
                check_fail
            fi
        else
            info "No test script defined in package.json"
        fi
    else
        warn "npm not available, skipping tests"
        check_warn
    fi
else
    info "Test configuration not found"
fi

echo ""

# ---------------------------------------------------------------------------
# 8. Database Migrations Status
# ---------------------------------------------------------------------------
echo "8. Database Migrations"
echo "   ────────────────────────────────────────────────────────"

if command -v docker &> /dev/null && [[ -f "${COMPOSE_FILE}" ]]; then
    # Check if migrations directory exists
    MIGRATIONS_DIR="${PROJECT_DIR}/backend/migrations"
    if [[ -d "${MIGRATIONS_DIR}" ]]; then
        MIGRATION_COUNT=$(find "${MIGRATIONS_DIR}" -name "*.py" -type f 2>/dev/null | wc -l)
        ok "Database migrations directory found (${MIGRATION_COUNT} files)"
        check_pass
    else
        warn "Migrations directory not found: ${MIGRATIONS_DIR}"
        check_warn
    fi

    info "Run migrations before deployment with:"
    info "  docker compose -f docker/docker-compose.yml run flask db upgrade"
else
    warn "Cannot check migrations without Docker"
    check_warn
fi

echo ""

# ---------------------------------------------------------------------------
# 9. SSL Certificate Validation
# ---------------------------------------------------------------------------
echo "9. SSL Certificate Validation"
echo "   ────────────────────────────────────────────────────────"

DOMAIN="${DOMAIN:-puraestate.com}"

if command -v openssl &> /dev/null; then
    CERT_INFO=$(echo | openssl s_client -connect "${DOMAIN}:443" -servername "${DOMAIN}" 2>/dev/null | openssl x509 -noout -enddate 2>/dev/null || echo "")

    if [[ -n "${CERT_INFO}" ]]; then
        CERT_EXPIRY="${CERT_INFO#*=}"
        EXPIRY_EPOCH=$(date -d "${CERT_EXPIRY}" +%s 2>/dev/null || echo 0)
        NOW_EPOCH=$(date +%s)
        DAYS_LEFT=$(( (EXPIRY_EPOCH - NOW_EPOCH) / 86400 ))

        if [[ ${DAYS_LEFT} -gt 30 ]]; then
            ok "SSL certificate valid, expires in ${DAYS_LEFT} days"
            check_pass
        elif [[ ${DAYS_LEFT} -gt 0 ]]; then
            fail "SSL certificate expiring soon (${DAYS_LEFT} days remaining)"
            check_fail
        else
            fail "SSL certificate expired"
            check_fail
        fi
    else
        warn "Could not verify SSL certificate for ${DOMAIN}"
        check_warn
    fi
else
    warn "openssl not available, skipping SSL certificate check"
    check_warn
fi

echo ""

# ---------------------------------------------------------------------------
# 10. Disk Space Check
# ---------------------------------------------------------------------------
echo "10. Disk Space Availability"
echo "    ────────────────────────────────────────────────────────"

AVAILABLE_SPACE=$(df "${PROJECT_DIR}" | awk 'NR==2 {print $4}')
REQUIRED_SPACE=$((5 * 1024 * 1024))  # 5 GB in KB

if [[ ${AVAILABLE_SPACE} -gt ${REQUIRED_SPACE} ]]; then
    AVAILABLE_GB=$((AVAILABLE_SPACE / 1024 / 1024))
    ok "Sufficient disk space available (${AVAILABLE_GB} GB)"
    check_pass
else
    AVAILABLE_GB=$((AVAILABLE_SPACE / 1024 / 1024))
    fail "Insufficient disk space (${AVAILABLE_GB} GB available, 5 GB required)"
    check_fail
fi

echo ""

# ---------------------------------------------------------------------------
# 11. Integration Verification
# ---------------------------------------------------------------------------
echo "11. Integration Verification"
echo "    ────────────────────────────────────────────────────────"

if [[ -f "${SCRIPT_DIR}/verify-integrations.sh" ]]; then
    info "Running integration verification..."
    if bash "${SCRIPT_DIR}/verify-integrations.sh" > /dev/null 2>&1; then
        ok "All integrations verified"
        check_pass
    else
        fail "Some integrations failed verification"
        check_fail
    fi
else
    warn "Integration verification script not found"
    check_warn
fi

echo ""

# ---------------------------------------------------------------------------
# Summary Report
# ---------------------------------------------------------------------------
TOTAL_CHECKS=$((CHECKS_PASSED + CHECKS_FAILED + CHECKS_WARNING))

echo "============================================================"
echo "  Validation Summary"
echo "============================================================"
echo ""
echo "  Total Checks:       ${TOTAL_CHECKS}"
echo "  Passed:             ${CHECKS_PASSED}"
echo "  Failed:             ${CHECKS_FAILED}"
echo "  Warnings:           ${CHECKS_WARNING}"
echo ""

if [[ ${CHECKS_FAILED} -eq 0 ]]; then
    echo -e "  ${GREEN}✓ Pre-deployment validation successful!${NC}"
    echo ""
    echo "  Next steps:"
    echo "    1. Review any warnings above"
    echo "    2. Run: docker compose -f docker/docker-compose.yml up -d"
    echo "    3. Verify with: ./scripts/healthcheck.sh"
    echo ""
    exit 0
else
    echo -e "  ${RED}✗ Pre-deployment validation failed!${NC}"
    echo -e "  ${RED}  Fix the errors above before deploying.${NC}"
    echo ""
    exit 1
fi
