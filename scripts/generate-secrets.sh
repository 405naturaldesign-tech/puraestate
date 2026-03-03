#!/usr/bin/env bash
# =============================================================================
# PuraEstate – Secret Generator
# =============================================================================
# Generates cryptographically strong random values for all secrets in .env.
# Writes a ready-to-use .env file (with CHANGE_ME replaced for auto-generable
# secrets). You must still fill in external API keys manually.
#
# Usage:
#   ./scripts/generate-secrets.sh
#   ./scripts/generate-secrets.sh --output /path/to/.env
# =============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEPLOY_DIR="$(dirname "$SCRIPT_DIR")"
OUTPUT_FILE="${1:---output}"
OUTPUT_PATH="${DEPLOY_DIR}/.env"

# Parse --output flag
while [[ $# -gt 0 ]]; do
    case "$1" in
        --output) OUTPUT_PATH="$2"; shift 2 ;;
        *) shift ;;
    esac
done

# ---------------------------------------------------------------------------
# Generator helpers
# ---------------------------------------------------------------------------
hex64()    { python3 -c "import secrets; print(secrets.token_hex(64))"; }
hex32()    { python3 -c "import secrets; print(secrets.token_hex(32))"; }
hex16()    { python3 -c "import secrets; print(secrets.token_hex(16))"; }
urlsafe32(){ python3 -c "import secrets; print(secrets.token_urlsafe(32))"; }
urlsafe24(){ python3 -c "import secrets; print(secrets.token_urlsafe(24))"; }

log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*"; }

# ---------------------------------------------------------------------------
# Safety check
# ---------------------------------------------------------------------------
if [[ -f "${OUTPUT_PATH}" ]]; then
    echo "WARNING: ${OUTPUT_PATH} already exists."
    read -rp "Overwrite? [y/N] " confirm
    [[ "${confirm,,}" == "y" ]] || { echo "Aborted."; exit 0; }
    cp "${OUTPUT_PATH}" "${OUTPUT_PATH}.bak.$(date +%s)"
    echo "Original backed up."
fi

# ---------------------------------------------------------------------------
# Generate all secrets
# ---------------------------------------------------------------------------
log "Generating secrets..."

SECRET_KEY=$(hex64)
JWT_SECRET_KEY=$(hex64)
POSTGRES_PASSWORD=$(urlsafe32)
REDIS_PASSWORD=$(urlsafe24)
FLOWER_PASSWORD=$(urlsafe24)
N8N_ENCRYPTION_KEY=$(hex16)
N8N_PASSWORD=$(urlsafe24)

# ---------------------------------------------------------------------------
# Write .env
# ---------------------------------------------------------------------------
cat > "${OUTPUT_PATH}" <<ENV
# =============================================================================
# PuraEstate – Auto-generated environment file
# Generated: $(date -u +%Y-%m-%dT%H:%M:%SZ)
# =============================================================================
# IMPORTANT: Fill in all <REQUIRED> placeholders before deploying!
# Keep this file secure (chmod 600) and NEVER commit it to git.
# =============================================================================

# ---------------------------------------------------------------------------
# Application
# ---------------------------------------------------------------------------
APP_VERSION=1.0.0
DOMAIN=puraestate.com

# ---------------------------------------------------------------------------
# Flask secrets (auto-generated)
# ---------------------------------------------------------------------------
SECRET_KEY=${SECRET_KEY}
JWT_SECRET_KEY=${JWT_SECRET_KEY}
JWT_ACCESS_EXPIRES_MINUTES=60
JWT_REFRESH_EXPIRES_DAYS=30

# ---------------------------------------------------------------------------
# PostgreSQL (auto-generated password)
# ---------------------------------------------------------------------------
POSTGRES_DB=puraestate_prod
POSTGRES_USER=puraestate
POSTGRES_PASSWORD=${POSTGRES_PASSWORD}

# ---------------------------------------------------------------------------
# Redis (auto-generated password)
# ---------------------------------------------------------------------------
REDIS_PASSWORD=${REDIS_PASSWORD}

# ---------------------------------------------------------------------------
# Flask workers
# ---------------------------------------------------------------------------
FLASK_WORKERS=5

# ---------------------------------------------------------------------------
# Celery
# ---------------------------------------------------------------------------
CELERY_CONCURRENCY=4

# ---------------------------------------------------------------------------
# Flower (auto-generated password)
# ---------------------------------------------------------------------------
FLOWER_USER=admin
FLOWER_PASSWORD=${FLOWER_PASSWORD}

# ---------------------------------------------------------------------------
# Email – FILL IN MANUALLY
# ---------------------------------------------------------------------------
MAIL_SERVER=smtp.sendgrid.net
MAIL_PORT=587
MAIL_USERNAME=apikey
MAIL_PASSWORD=<REQUIRED: SendGrid API key>
MAIL_DEFAULT_SENDER=noreply@puraestate.com
SENDGRID_API_KEY=<REQUIRED: SendGrid API key>

# ---------------------------------------------------------------------------
# AWS S3 – FILL IN MANUALLY
# ---------------------------------------------------------------------------
AWS_ACCESS_KEY_ID=<REQUIRED>
AWS_SECRET_ACCESS_KEY=<REQUIRED>
AWS_S3_BUCKET=puraestate-media-prod
AWS_REGION=us-east-1

# ---------------------------------------------------------------------------
# Stripe – FILL IN MANUALLY
# ---------------------------------------------------------------------------
STRIPE_SECRET_KEY=<REQUIRED: sk_live_...>
STRIPE_PUBLISHABLE_KEY=<REQUIRED: pk_live_...>
STRIPE_WEBHOOK_SECRET=<REQUIRED: whsec_...>

# ---------------------------------------------------------------------------
# Google Maps – FILL IN MANUALLY
# ---------------------------------------------------------------------------
GOOGLE_MAPS_API_KEY=<REQUIRED>

# ---------------------------------------------------------------------------
# Mapbox – FILL IN MANUALLY
# ---------------------------------------------------------------------------
NEXT_PUBLIC_MAPBOX_TOKEN=<REQUIRED>

# ---------------------------------------------------------------------------
# n8n (auto-generated key and password)
# ---------------------------------------------------------------------------
N8N_ENCRYPTION_KEY=${N8N_ENCRYPTION_KEY}
N8N_POSTGRES_DB=puraestate_n8n
N8N_USER=admin
N8N_PASSWORD=${N8N_PASSWORD}

# ---------------------------------------------------------------------------
# Let's Encrypt
# ---------------------------------------------------------------------------
LETSENCRYPT_EMAIL=<REQUIRED: your email>
ENV

chmod 600 "${OUTPUT_PATH}"
log "======================================================================"
log "Secrets written to: ${OUTPUT_PATH}"
log ""
log "Auto-generated:"
log "  SECRET_KEY, JWT_SECRET_KEY, POSTGRES_PASSWORD, REDIS_PASSWORD,"
log "  FLOWER_PASSWORD, N8N_ENCRYPTION_KEY, N8N_PASSWORD"
log ""
log "REQUIRED – fill these in manually:"
log "  MAIL_PASSWORD / SENDGRID_API_KEY"
log "  AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY"
log "  STRIPE_SECRET_KEY / STRIPE_PUBLISHABLE_KEY / STRIPE_WEBHOOK_SECRET"
log "  GOOGLE_MAPS_API_KEY"
log "  NEXT_PUBLIC_MAPBOX_TOKEN"
log "  LETSENCRYPT_EMAIL"
log "======================================================================"
