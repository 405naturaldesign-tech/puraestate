#!/usr/bin/env bash
# =============================================================================
# PuraEstate – SSL Certificate Initialization Script
# =============================================================================
# Run this ONCE on the VPS before starting the stack for the first time.
# It obtains a Let's Encrypt certificate via Certbot and generates DH params.
#
# Prerequisites:
#   - DNS A records for puraestate.com and www.puraestate.com point to the VPS
#   - Ports 80 and 443 are open in the firewall
#   - Docker and docker-compose are installed
#
# Usage:
#   cd /home/deploy/puraestate/deploy
#   chmod +x scripts/init-ssl.sh
#   sudo ./scripts/init-ssl.sh
# =============================================================================

set -euo pipefail

# ---------------------------------------------------------------------------
# Load configuration
# ---------------------------------------------------------------------------
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEPLOY_DIR="$(dirname "$SCRIPT_DIR")"

if [[ -f "${DEPLOY_DIR}/.env" ]]; then
    # shellcheck disable=SC1091
    set -o allexport
    source "${DEPLOY_DIR}/.env"
    set +o allexport
else
    echo "ERROR: .env file not found at ${DEPLOY_DIR}/.env" >&2
    echo "       Copy .env.production to .env and fill in values first." >&2
    exit 1
fi

DOMAIN="${DOMAIN:-puraestate.com}"
EMAIL="${LETSENCRYPT_EMAIL:-devops@puraestate.com}"
NGINX_SSL_DIR="${DEPLOY_DIR}/nginx/ssl"
LETSENCRYPT_DIR="/etc/letsencrypt"
CERTBOT_WEBROOT="/var/lib/docker/volumes/puraestate-certbot-webroot/_data"

# ---------------------------------------------------------------------------
# Helper functions
# ---------------------------------------------------------------------------
log()  { echo "[$(date '+%Y-%m-%d %H:%M:%S')] INFO  $*"; }
warn() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] WARN  $*" >&2; }
err()  { echo "[$(date '+%Y-%m-%d %H:%M:%S')] ERROR $*" >&2; exit 1; }

# ---------------------------------------------------------------------------
# 1. Ensure required tools are present
# ---------------------------------------------------------------------------
for tool in certbot openssl docker; do
    command -v "$tool" >/dev/null 2>&1 || err "$tool is required but not installed."
done

# ---------------------------------------------------------------------------
# 2. Create directories
# ---------------------------------------------------------------------------
log "Creating required directories..."
mkdir -p \
    "${NGINX_SSL_DIR}" \
    "${CERTBOT_WEBROOT}" \
    "/var/log/puraestate"

# ---------------------------------------------------------------------------
# 3. Generate DH parameters (takes a few minutes)
# ---------------------------------------------------------------------------
DHPARAM_FILE="${NGINX_SSL_DIR}/dhparam.pem"
if [[ ! -f "${DHPARAM_FILE}" ]]; then
    log "Generating 2048-bit DH parameters (this may take 1-3 minutes)..."
    openssl dhparam -out "${DHPARAM_FILE}" 2048
    chmod 640 "${DHPARAM_FILE}"
    log "DH parameters generated at ${DHPARAM_FILE}"
else
    log "DH parameters already exist, skipping generation."
fi

# ---------------------------------------------------------------------------
# 4. Start nginx with self-signed cert (serves ACME challenge)
# ---------------------------------------------------------------------------
log "Starting nginx with self-signed certificate for ACME challenge..."

# Temporarily use self-signed cert config if Let's Encrypt certs don't exist yet
LIVE_CERT_PATH="${LETSENCRYPT_DIR}/live/${DOMAIN}/fullchain.pem"

if [[ ! -f "${LIVE_CERT_PATH}" ]]; then
    log "Let's Encrypt certificate not found. Configuring nginx for ACME challenge..."

    # Create a temporary nginx config that uses the self-signed cert
    # (so nginx can start and serve /.well-known/acme-challenge/)
    cat > /tmp/puraestate-acme.conf <<NGINX_CONF
server {
    listen 80;
    server_name ${DOMAIN} www.${DOMAIN};

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
        try_files \$uri =404;
    }

    location / {
        return 200 'ACME challenge server running';
        add_header Content-Type text/plain;
    }
}
NGINX_CONF

    # Start nginx for ACME challenge only
    docker run -d --rm \
        --name puraestate-acme-nginx \
        -p 80:80 \
        -v "${CERTBOT_WEBROOT}:/var/www/certbot:rw" \
        -v /tmp/puraestate-acme.conf:/etc/nginx/conf.d/default.conf:ro \
        nginx:1.27-alpine

    sleep 3

    # ---------------------------------------------------------------------------
    # 5. Obtain Let's Encrypt certificate (webroot method)
    # ---------------------------------------------------------------------------
    log "Requesting Let's Encrypt certificate for ${DOMAIN} and www.${DOMAIN}..."
    certbot certonly \
        --webroot \
        --webroot-path "${CERTBOT_WEBROOT}" \
        --email "${EMAIL}" \
        --agree-tos \
        --no-eff-email \
        --domains "${DOMAIN},www.${DOMAIN}" \
        --non-interactive \
        --keep-until-expiring

    # Stop the temporary nginx
    docker stop puraestate-acme-nginx 2>/dev/null || true

    log "SSL certificate obtained successfully!"
else
    log "Let's Encrypt certificate already exists for ${DOMAIN}."
fi

# ---------------------------------------------------------------------------
# 6. Set up automatic renewal (cron job)
# ---------------------------------------------------------------------------
CRON_FILE="/etc/cron.d/puraestate-certbot-renewal"
if [[ ! -f "${CRON_FILE}" ]]; then
    log "Setting up automatic certificate renewal..."
    cat > "${CRON_FILE}" <<CRON
# PuraEstate – Certbot automatic renewal
# Runs at 3:00 AM on the 1st and 15th of every month
0 3 1,15 * * root certbot renew --quiet --deploy-hook "docker exec puraestate-nginx nginx -s reload" >> /var/log/letsencrypt/renewal.log 2>&1
CRON
    chmod 644 "${CRON_FILE}"
    log "Certbot renewal cron job installed at ${CRON_FILE}"
fi

# ---------------------------------------------------------------------------
# 7. Verify certificate
# ---------------------------------------------------------------------------
log "Verifying certificate..."
openssl x509 -in "${LIVE_CERT_PATH}" -noout -subject -issuer -dates

# ---------------------------------------------------------------------------
# Summary
# ---------------------------------------------------------------------------
log "======================================================================"
log "SSL initialization complete!"
log ""
log "  Domain      : ${DOMAIN}"
log "  Certificate : ${LIVE_CERT_PATH}"
log "  DH Params   : ${DHPARAM_FILE}"
log "  Auto-renewal: ${CRON_FILE}"
log ""
log "Next steps:"
log "  1. Start the full stack: docker compose up -d"
log "  2. Verify: curl -I https://${DOMAIN}"
log "======================================================================"
