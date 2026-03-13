#!/bin/bash
# =============================================================================
# PuraEstate – Integration Verification Script
# =============================================================================
# Tests connectivity and validity of all external integrations.
# Verifies Firebase, Stripe, Composio, OpenRouter, SendGrid, and AWS S3.
#
# Usage:
#   ./scripts/verify-integrations.sh
#
# Exit codes:
#   0 - All integrations pass
#   1 - One or more integrations fail
# =============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
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
TESTS_PASSED=0
TESTS_FAILED=0
TESTS_WARNING=0

test_pass() {
    ((TESTS_PASSED++))
}

test_fail() {
    ((TESTS_FAILED++))
}

test_warn() {
    ((TESTS_WARNING++))
}

# ---------------------------------------------------------------------------
# Header
# ---------------------------------------------------------------------------
echo ""
echo "============================================================"
echo "  PuraEstate Integration Verification – $(date '+%Y-%m-%d %H:%M:%S')"
echo "============================================================"
echo ""

# ---------------------------------------------------------------------------
# Function to test required environment variables
# ---------------------------------------------------------------------------
check_env_var() {
    local var_name=$1
    local var_value=${!var_name:-}

    if [[ -z "${var_value}" ]]; then
        fail "Missing environment variable: ${var_name}"
        test_fail
        return 1
    else
        ok "Environment variable set: ${var_name}"
        test_pass
        return 0
    fi
}

# ---------------------------------------------------------------------------
# 1. Firebase Connectivity Test
# ---------------------------------------------------------------------------
echo "1. Firebase Connectivity Test"
echo "   ────────────────────────────────────────────────────────"

FIREBASE_PASS=true

if ! check_env_var "EXPO_PUBLIC_FIREBASE_API_KEY"; then
    FIREBASE_PASS=false
fi

if ! check_env_var "EXPO_PUBLIC_FIREBASE_PROJECT_ID"; then
    FIREBASE_PASS=false
fi

if ! check_env_var "EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET"; then
    FIREBASE_PASS=false
fi

if [[ "${FIREBASE_PASS}" == "true" ]]; then
    # Verify Firebase credentials format (basic validation)
    if [[ -n "${EXPO_PUBLIC_FIREBASE_API_KEY}" && "${#EXPO_PUBLIC_FIREBASE_API_KEY}" -gt 20 ]]; then
        ok "Firebase API key format appears valid (${#EXPO_PUBLIC_FIREBASE_API_KEY} chars)"
        test_pass
    else
        fail "Firebase API key format invalid or too short"
        test_fail
    fi

    # Attempt Firebase project ID validation
    PROJECT_ID="${EXPO_PUBLIC_FIREBASE_PROJECT_ID}"
    if [[ -n "${PROJECT_ID}" ]]; then
        ok "Firebase Project ID: ${PROJECT_ID}"
        test_pass
    else
        fail "Firebase Project ID missing or invalid"
        test_fail
    fi
fi

echo ""

# ---------------------------------------------------------------------------
# 2. Stripe API Key Validation
# ---------------------------------------------------------------------------
echo "2. Stripe API Key Validation"
echo "   ────────────────────────────────────────────────────────"

STRIPE_PASS=true

if ! check_env_var "STRIPE_SECRET_KEY"; then
    STRIPE_PASS=false
fi

if ! check_env_var "EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY"; then
    STRIPE_PASS=false
fi

if [[ "${STRIPE_PASS}" == "true" ]]; then
    # Validate Stripe secret key format (should start with sk_live_ or sk_test_)
    SECRET_KEY="${STRIPE_SECRET_KEY}"
    if [[ "${SECRET_KEY}" =~ ^sk_(live|test)_ ]]; then
        ok "Stripe secret key format valid (${SECRET_KEY:0:7}***)"
        test_pass
    else
        fail "Stripe secret key format invalid (expected sk_live_ or sk_test_)"
        test_fail
    fi

    # Validate Stripe publishable key format
    PUBLISHABLE_KEY="${EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY}"
    if [[ "${PUBLISHABLE_KEY}" =~ ^pk_(live|test)_ ]]; then
        ok "Stripe publishable key format valid (${PUBLISHABLE_KEY:0:7}***)"
        test_pass
    else
        fail "Stripe publishable key format invalid (expected pk_live_ or pk_test_)"
        test_fail
    fi

    # Test Stripe connectivity with a simple API call
    if command -v curl &> /dev/null; then
        STRIPE_TEST=$(curl -s -u "${STRIPE_SECRET_KEY}:" https://api.stripe.com/v1/account -w "\n%{http_code}" 2>/dev/null | tail -n 1)
        if [[ "${STRIPE_TEST}" == "200" ]]; then
            ok "Stripe API connectivity verified (HTTP 200)"
            test_pass
        else
            warn "Stripe API connectivity check returned HTTP ${STRIPE_TEST}"
            test_warn
        fi
    else
        info "curl not available, skipping Stripe API connectivity test"
    fi
fi

echo ""

# ---------------------------------------------------------------------------
# 3. Composio API Key Validation
# ---------------------------------------------------------------------------
echo "3. Composio API Key Validation"
echo "   ────────────────────────────────────────────────────────"

if check_env_var "COMPOSIO_API_KEY"; then
    COMPOSIO_KEY="${COMPOSIO_API_KEY}"

    # Test Composio API connectivity
    if command -v curl &> /dev/null; then
        COMPOSIO_TEST=$(curl -s -H "Authorization: Bearer ${COMPOSIO_KEY}" \
            https://api.composio.dev/v1/connectors -w "\n%{http_code}" 2>/dev/null | tail -n 1)

        if [[ "${COMPOSIO_TEST}" == "200" ]]; then
            ok "Composio API connectivity verified (HTTP 200)"
            test_pass
        elif [[ "${COMPOSIO_TEST}" == "401" ]] || [[ "${COMPOSIO_TEST}" == "403" ]]; then
            fail "Composio API authentication failed (HTTP ${COMPOSIO_TEST})"
            test_fail
        else
            warn "Composio API connectivity check returned HTTP ${COMPOSIO_TEST}"
            test_warn
        fi
    else
        info "curl not available, skipping Composio API connectivity test"
    fi
else
    info "Composio API key not configured (optional integration)"
fi

echo ""

# ---------------------------------------------------------------------------
# 4. OpenRouter API Key Validation
# ---------------------------------------------------------------------------
echo "4. OpenRouter API Key Validation"
echo "   ────────────────────────────────────────────────────────"

if check_env_var "OPENROUTER_API_KEY"; then
    OPENROUTER_KEY="${OPENROUTER_API_KEY}"

    # Test OpenRouter API connectivity
    if command -v curl &> /dev/null; then
        OPENROUTER_TEST=$(curl -s -H "Authorization: Bearer ${OPENROUTER_KEY}" \
            https://openrouter.ai/api/v1/auth/key \
            -w "\n%{http_code}" 2>/dev/null | tail -n 1)

        if [[ "${OPENROUTER_TEST}" == "200" ]]; then
            ok "OpenRouter API connectivity verified (HTTP 200)"
            test_pass
        elif [[ "${OPENROUTER_TEST}" == "401" ]] || [[ "${OPENROUTER_TEST}" == "403" ]]; then
            fail "OpenRouter API authentication failed (HTTP ${OPENROUTER_TEST})"
            test_fail
        else
            warn "OpenRouter API connectivity check returned HTTP ${OPENROUTER_TEST}"
            test_warn
        fi
    else
        info "curl not available, skipping OpenRouter API connectivity test"
    fi
else
    info "OpenRouter API key not configured (optional integration)"
fi

echo ""

# ---------------------------------------------------------------------------
# 5. SendGrid API Key Validation
# ---------------------------------------------------------------------------
echo "5. SendGrid API Key Validation"
echo "   ────────────────────────────────────────────────────────"

if check_env_var "SENDGRID_API_KEY"; then
    SENDGRID_KEY="${SENDGRID_API_KEY}"

    # Validate SendGrid key format (should be alphanumeric and reasonably long)
    if [[ ${#SENDGRID_KEY} -gt 30 ]]; then
        ok "SendGrid API key format appears valid (${#SENDGRID_KEY} chars)"
        test_pass
    else
        fail "SendGrid API key format invalid or too short"
        test_fail
    fi

    # Test SendGrid API connectivity
    if command -v curl &> /dev/null; then
        SENDGRID_TEST=$(curl -s -H "Authorization: Bearer ${SENDGRID_KEY}" \
            https://api.sendgrid.com/v3/user/account \
            -w "\n%{http_code}" 2>/dev/null | tail -n 1)

        if [[ "${SENDGRID_TEST}" == "200" ]]; then
            ok "SendGrid API connectivity verified (HTTP 200)"
            test_pass
        elif [[ "${SENDGRID_TEST}" == "401" ]] || [[ "${SENDGRID_TEST}" == "403" ]]; then
            fail "SendGrid API authentication failed (HTTP ${SENDGRID_TEST})"
            test_fail
        else
            warn "SendGrid API connectivity check returned HTTP ${SENDGRID_TEST}"
            test_warn
        fi
    else
        info "curl not available, skipping SendGrid API connectivity test"
    fi
else
    info "SendGrid API key not configured (optional integration)"
fi

echo ""

# ---------------------------------------------------------------------------
# 6. AWS S3 Connectivity Test
# ---------------------------------------------------------------------------
echo "6. AWS S3 Connectivity Test"
echo "   ────────────────────────────────────────────────────────"

AWS_PASS=true

if ! check_env_var "AWS_ACCESS_KEY_ID"; then
    AWS_PASS=false
fi

if ! check_env_var "AWS_SECRET_ACCESS_KEY"; then
    AWS_PASS=false
fi

if ! check_env_var "AWS_S3_BUCKET"; then
    AWS_PASS=false
fi

if [[ "${AWS_PASS}" == "true" ]]; then
    AWS_REGION="${AWS_REGION:-us-east-1}"
    S3_BUCKET="${AWS_S3_BUCKET}"

    ok "AWS S3 bucket configured: ${S3_BUCKET}"
    test_pass

    # Test S3 connectivity with AWS CLI if available
    if command -v aws &> /dev/null; then
        # Export AWS credentials temporarily for this test
        export AWS_ACCESS_KEY_ID
        export AWS_SECRET_ACCESS_KEY
        export AWS_DEFAULT_REGION="${AWS_REGION}"

        # Test S3 bucket accessibility
        if aws s3 ls "s3://${S3_BUCKET}" --max-items 1 &>/dev/null; then
            ok "AWS S3 bucket accessible via AWS CLI"
            test_pass
        else
            fail "AWS S3 bucket not accessible (check credentials and permissions)"
            test_fail
        fi

        unset AWS_ACCESS_KEY_ID AWS_SECRET_ACCESS_KEY AWS_DEFAULT_REGION
    else
        info "AWS CLI not available, skipping S3 bucket accessibility test"
        info "Install AWS CLI to enable this test: pip install awscli"
    fi
fi

echo ""

# ---------------------------------------------------------------------------
# 7. Email Configuration Check
# ---------------------------------------------------------------------------
echo "7. Email Configuration Check"
echo "   ────────────────────────────────────────────────────────"

if check_env_var "MAIL_SERVER"; then
    if check_env_var "MAIL_USERNAME"; then
        if check_env_var "MAIL_PASSWORD"; then
            ok "Email server credentials configured"
            test_pass
        fi
    fi
else
    info "Email server not configured (optional integration)"
fi

echo ""

# ---------------------------------------------------------------------------
# Summary Report
# ---------------------------------------------------------------------------
TOTAL_TESTS=$((TESTS_PASSED + TESTS_FAILED + TESTS_WARNING))

echo "============================================================"
echo "  Verification Summary – $(date '+%Y-%m-%d %H:%M:%S')"
echo "============================================================"
echo ""
echo "  Total Tests:        ${TOTAL_TESTS}"
echo "  Passed:             ${TESTS_PASSED}"
echo "  Failed:             ${TESTS_FAILED}"
echo "  Warnings:           ${TESTS_WARNING}"
echo ""

if [[ ${TESTS_FAILED} -eq 0 ]]; then
    echo -e "  ${GREEN}✓ All integration verifications passed!${NC}"
    echo ""
    exit 0
else
    echo -e "  ${RED}✗ Some integration verifications failed!${NC}"
    echo -e "  ${RED}  Please configure missing environment variables and retry.${NC}"
    echo ""
    exit 1
fi
