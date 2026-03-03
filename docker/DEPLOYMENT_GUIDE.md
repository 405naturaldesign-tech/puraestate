# PuraEstate SaaS – Production Deployment Guide
## Hostinger VPS + puraestate.com

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [VPS Server Setup (Hostinger)](#2-vps-server-setup-hostinger)
3. [DNS Configuration](#3-dns-configuration)
4. [Project Deployment](#4-project-deployment)
5. [SSL Certificate Setup](#5-ssl-certificate-setup)
6. [First Deployment](#6-first-deployment)
7. [Secrets Management](#7-secrets-management)
8. [Ongoing Deployments](#8-ongoing-deployments)
9. [Monitoring Setup](#9-monitoring-setup)
10. [Backup Strategy](#10-backup-strategy)
11. [Troubleshooting](#11-troubleshooting)
12. [Security Hardening](#12-security-hardening)

---

## 1. Architecture Overview

```
Internet
   │
   ▼
[Cloudflare / DNS]
   │
   ▼  :80 / :443
[Nginx Reverse Proxy]  ──────────────────────────┐
   │                                              │
   ├──── /api/*  ────►  [Flask + Gunicorn :5000]  │  backend network
   │                          │                   │
   └──── /*      ────►  [Next.js :3000]           │
                              │                   │
                    [PostgreSQL :5432] ◄───────────┤
                    [Redis :6379]      ◄───────────┘
                              │
                    [Celery Worker]
                    [Flower :5555] (internal only)
                    [n8n :5678]    (optional)
```

**Networks:**
- `puraestate-backend` – isolated network: postgres, redis, flask, celery
- `puraestate-frontend` – DMZ network: nginx ↔ flask, nginx ↔ nextjs

**Data volumes:**
- `puraestate-postgres-data` – PostgreSQL data files
- `puraestate-redis-data` – Redis persistence (RDB + AOF)
- `puraestate-uploads` – User-uploaded media (shared: flask + celery)
- `puraestate-letsencrypt` – SSL certificates (bind mount: `/etc/letsencrypt`)

---

## 2. VPS Server Setup (Hostinger)

### Recommended VPS Specs

| Resource | Minimum | Recommended |
|----------|---------|-------------|
| CPU      | 2 vCPU  | 4 vCPU      |
| RAM      | 4 GB    | 8 GB        |
| Storage  | 40 GB SSD | 80 GB SSD |
| OS       | Ubuntu 22.04 LTS | Ubuntu 22.04 LTS |

### 2.1 Initial Server Hardening

SSH into your Hostinger VPS as root:

```bash
# Update the system
apt update && apt upgrade -y

# Install essential tools
apt install -y \
    curl wget git vim htop \
    ufw fail2ban \
    apt-transport-https \
    ca-certificates \
    gnupg lsb-release \
    unzip jq

# Set hostname
hostnamectl set-hostname puraestate-prod
```

### 2.2 Create a Deploy User

```bash
# Create dedicated deploy user (never run the app as root)
useradd -m -s /bin/bash -G sudo,docker deploy
passwd deploy  # Set a strong password

# Copy SSH keys (on your LOCAL machine)
ssh-copy-id -i ~/.ssh/id_ed25519.pub deploy@YOUR_VPS_IP

# Switch to deploy user
su - deploy
```

### 2.3 Firewall Configuration (UFW)

```bash
# Reset UFW
ufw --force reset

# Default deny
ufw default deny incoming
ufw default allow outgoing

# Allow SSH (adjust port if you changed it)
ufw allow 22/tcp

# Allow HTTP and HTTPS
ufw allow 80/tcp
ufw allow 443/tcp

# Enable firewall
ufw enable

# Verify
ufw status verbose
```

### 2.4 SSH Hardening

Edit `/etc/ssh/sshd_config`:

```
Port 22
PermitRootLogin no
PasswordAuthentication no
PubkeyAuthentication yes
AuthorizedKeysFile .ssh/authorized_keys
MaxAuthTries 3
ClientAliveInterval 300
ClientAliveCountMax 2
X11Forwarding no
AllowUsers deploy
```

```bash
systemctl restart sshd
```

### 2.5 Fail2Ban Configuration

```bash
# Create jail config
cat > /etc/fail2ban/jail.local <<'EOF'
[DEFAULT]
bantime  = 3600
findtime = 600
maxretry = 5
backend  = systemd

[sshd]
enabled = true
port    = ssh
logpath = %(sshd_log)s

[nginx-http-auth]
enabled = true

[nginx-botsearch]
enabled = true
EOF

systemctl enable fail2ban
systemctl restart fail2ban
```

### 2.6 Install Docker

```bash
# Install Docker Engine (official method)
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | \
    gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] \
    https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | \
    tee /etc/apt/sources.list.d/docker.list > /dev/null

apt update
apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Add deploy user to docker group
usermod -aG docker deploy

# Enable Docker daemon on boot
systemctl enable docker
systemctl start docker

# Verify
docker --version
docker compose version
```

### 2.7 System Tuning

```bash
# Increase open file limits for nginx and postgres
cat >> /etc/security/limits.conf <<'EOF'
*         soft    nofile    65536
*         hard    nofile    65536
root      soft    nofile    65536
root      hard    nofile    65536
EOF

# Kernel parameters
cat >> /etc/sysctl.conf <<'EOF'
# Network performance
net.core.somaxconn = 65536
net.ipv4.tcp_max_syn_backlog = 8192
net.ipv4.tcp_tw_reuse = 1
net.ipv4.ip_local_port_range = 1024 65535

# Virtual memory (prevent OOM on PostgreSQL)
vm.swappiness = 10
vm.overcommit_memory = 1

# File system
fs.file-max = 2097152
fs.inotify.max_user_watches = 524288
EOF

sysctl -p
```

### 2.8 Swap Space (recommended for 4 GB RAM VPS)

```bash
# Create 2 GB swap file
fallocate -l 2G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile

# Make permanent
echo '/swapfile none swap sw 0 0' >> /etc/fstab
```

---

## 3. DNS Configuration

### 3.1 Hostinger DNS Settings

In your Hostinger hPanel, go to **Domains → puraestate.com → DNS / Nameservers**.

Add the following DNS records:

| Type  | Host         | Points to           | TTL  |
|-------|-------------|---------------------|------|
| A     | @           | `YOUR_VPS_IP`       | 300  |
| A     | www         | `YOUR_VPS_IP`       | 300  |
| A     | api         | `YOUR_VPS_IP`       | 300  |
| A     | n8n         | `YOUR_VPS_IP`       | 300  |
| MX    | @           | `mail.puraestate.com` | 300 |
| TXT   | @           | `v=spf1 include:sendgrid.net ~all` | 300 |
| CNAME | em          | `u12345.wl.sendgrid.net` | 300 |

### 3.2 Verify DNS Propagation

```bash
# Check A record (wait up to 24h for full propagation)
dig +short puraestate.com A
dig +short www.puraestate.com A

# Should return your VPS IP address
```

---

## 4. Project Deployment

### 4.1 Clone the Repository

```bash
# As the deploy user
su - deploy
mkdir -p /home/deploy/puraestate
cd /home/deploy/puraestate

# Clone your repository
git clone https://github.com/YOUR_ORG/puraestate.git .

# The expected directory structure:
# /home/deploy/puraestate/
# ├── backend/       ← Flask API
# ├── frontend/      ← Next.js frontend
# └── deploy/        ← This deployment directory
```

### 4.2 Set Up Environment

```bash
cd /home/deploy/puraestate/deploy

# Generate auto-generable secrets
chmod +x scripts/*.sh
./scripts/generate-secrets.sh

# Edit .env and fill in required external API keys
vim .env

# Secure the file
chmod 600 .env
```

---

## 5. SSL Certificate Setup

### 5.1 Pre-requisites

Before running this script:
- DNS records must be pointing to your VPS (verify with `dig puraestate.com`)
- Ports 80 and 443 must be open in the firewall
- Docker must be installed

### 5.2 Run SSL Initialization

```bash
cd /home/deploy/puraestate/deploy
sudo ./scripts/init-ssl.sh
```

This script will:
1. Generate 2048-bit Diffie-Hellman parameters
2. Spin up a temporary nginx for the ACME challenge
3. Obtain a Let's Encrypt wildcard certificate via Certbot
4. Configure automatic renewal via cron

### 5.3 Manual Certificate Renewal (if needed)

```bash
# Test renewal (dry run)
certbot renew --dry-run

# Force renewal
certbot renew --force-renewal

# Reload nginx after renewal
docker exec puraestate-nginx nginx -s reload
```

### 5.4 Verify SSL Grade

After deployment, test your SSL at:
- https://www.ssllabs.com/ssltest/analyze.html?d=puraestate.com

Target: **A+** rating (with HSTS preloading).

---

## 6. First Deployment

```bash
cd /home/deploy/puraestate/deploy

# Step 1: Build and start infrastructure services
docker compose up -d postgres redis

# Step 2: Wait for health checks
docker compose ps

# Step 3: Initialize the database
./scripts/db-migrate.sh upgrade

# Step 4: Initialize Redis
./scripts/redis-init.sh

# Step 5: Build and start all services
docker compose up -d

# Step 6: Verify all containers are healthy
docker compose ps

# Step 7: Run health check
./scripts/healthcheck.sh
```

### 6.1 Seed Initial Data (optional)

```bash
# Run inside the Flask container
docker compose exec flask python -c "
from app import create_app
from database import db

app = create_app('production')
with app.app_context():
    # Create admin user, seed categories, etc.
    print('Database ready.')
"
```

---

## 7. Secrets Management

### 7.1 Secret Storage Rules

| Secret | Storage | Access |
|--------|---------|--------|
| `.env` file | VPS only | `chmod 600`, `chown deploy:deploy` |
| API keys | AWS SSM Parameter Store (recommended) | IAM role |
| Database passwords | Auto-generated, stored in `.env` | Docker secrets |
| JWT secret | Auto-generated, stored in `.env` | Flask only |
| SSL private key | `/etc/letsencrypt/` | `chmod 700`, root only |

### 7.2 Rotating Secrets

**Rotate a secret:**

```bash
# 1. Generate a new value
python3 -c "import secrets; print(secrets.token_hex(64))"

# 2. Update .env
vim /home/deploy/puraestate/deploy/.env

# 3. Restart affected service
docker compose restart flask celery

# For JWT_SECRET_KEY rotation: all active tokens are invalidated
# Warn users before rotating JWT secrets in production.
```

**Rotate PostgreSQL password:**

```bash
# 1. Update password in PostgreSQL
docker compose exec postgres psql -U puraestate -c \
    "ALTER USER puraestate PASSWORD 'new-strong-password';"

# 2. Update .env
# 3. Restart flask and celery
docker compose restart flask celery
```

### 7.3 .gitignore Requirements

Ensure these files are NEVER committed:

```gitignore
# In your project root .gitignore
deploy/.env
deploy/.env.production
deploy/nginx/ssl/dhparam.pem
deploy/nginx/ssl/self-signed.*
*.key
*.pem
*.p12
*.pfx
secrets/
```

---

## 8. Ongoing Deployments

### 8.1 Standard Deployment (code update)

```bash
cd /home/deploy/puraestate

# Pull latest code
git pull origin main

# Run deployment script
./deploy/scripts/deploy.sh
```

### 8.2 Deploy Specific Version

```bash
./deploy/scripts/deploy.sh --version 1.2.3
```

### 8.3 Emergency Rollback

```bash
# View recent images
docker images | grep puraestate

# Rollback flask to previous image
docker compose stop flask
docker tag puraestate/flask-api:1.1.0 puraestate/flask-api:latest
docker compose up -d flask

# Or use git to revert and rebuild
git checkout v1.1.0
./deploy/scripts/deploy.sh --skip-migrate
```

### 8.4 Database Migrations

```bash
# Always backup before migrations
./deploy/scripts/backup.sh

# Run migrations
./deploy/scripts/db-migrate.sh upgrade

# Check current state
./deploy/scripts/db-migrate.sh current

# View history
./deploy/scripts/db-migrate.sh history
```

---

## 9. Monitoring Setup

### 9.1 Container Monitoring (Built-in)

```bash
# Live resource usage
docker stats

# Container logs
docker compose logs -f --tail=100 flask
docker compose logs -f --tail=100 nginx
docker compose logs -f --tail=100 celery

# All services
docker compose logs -f --tail=50
```

### 9.2 Flower (Celery Monitoring)

Start Flower alongside the stack:

```bash
docker compose --profile monitoring up -d flower
```

Access Flower via SSH tunnel (never expose publicly):

```bash
# On your local machine
ssh -L 5556:localhost:5556 deploy@puraestate.com

# Then open in browser
open http://localhost:5556
```

### 9.3 Health Check Script

```bash
# Run manually
./deploy/scripts/healthcheck.sh

# Schedule via cron (every 5 minutes)
echo "*/5 * * * * deploy /home/deploy/puraestate/deploy/scripts/healthcheck.sh >> /var/log/puraestate/health.log 2>&1" \
    | sudo tee -a /etc/crontab
```

### 9.4 Log Management

Nginx logs are in JSON format for easy parsing:

```bash
# Recent 404s
docker exec puraestate-nginx cat /var/log/nginx/puraestate-access.log \
    | jq 'select(.status == 404)' | tail -20

# Slow requests (>1 second)
docker exec puraestate-nginx cat /var/log/nginx/puraestate-access.log \
    | jq 'select(.duration > 1)' | tail -20

# Flask error logs
docker compose logs flask 2>&1 | grep -E "ERROR|CRITICAL"
```

### 9.5 UptimeRobot / BetterUptime

Set up external uptime monitoring:

1. Create a free account at https://uptimerobot.com
2. Add HTTP(s) monitor:
   - URL: `https://puraestate.com/health`
   - Interval: 5 minutes
   - Alert when: down
3. Add SSL certificate monitor for expiry alerts

### 9.6 Recommended: Grafana + Prometheus (Advanced)

For production at scale, add observability:

```bash
# Add to docker-compose.yml (profiles: monitoring)
# prometheus, grafana, node-exporter, cadvisor
# (configuration files beyond scope of this guide)
```

---

## 10. Backup Strategy

### 10.1 Automated Daily Backups

```bash
# Install backup cron (runs at 2:00 AM daily)
echo "0 2 * * * deploy /home/deploy/puraestate/deploy/scripts/backup.sh --s3 >> /var/log/puraestate/backup.log 2>&1" \
    | sudo tee -a /etc/crontab

# Or for S3 upload:
echo "0 2 * * * deploy /home/deploy/puraestate/deploy/scripts/backup.sh --s3 --retention-days 30 >> /var/log/puraestate/backup.log 2>&1" \
    | sudo tee -a /etc/crontab
```

### 10.2 Manual Backup

```bash
# Local backup only
./deploy/scripts/backup.sh

# With S3 upload
./deploy/scripts/backup.sh --s3

# Retain for 60 days
./deploy/scripts/backup.sh --s3 --retention-days 60
```

### 10.3 Restore from Backup

```bash
# List available backups
ls -lh /var/backups/puraestate/

# Extract the archive
tar -xzf /var/backups/puraestate/puraestate-backup-20260101-020000.tar.gz \
    -C /tmp/restore/

# Restore PostgreSQL
gunzip -c /tmp/restore/*/postgres-*.sql.gz | \
    docker compose exec -T postgres psql -U puraestate puraestate_prod

# Restore Redis
gunzip -k /tmp/restore/*/redis-*.rdb.gz
docker cp redis-*.rdb puraestate-redis:/data/dump.rdb
docker compose restart redis
```

### 10.4 Backup Verification

Monthly, test that backups are restorable:

```bash
# Spin up a test postgres container
docker run -d --name pg-restore-test \
    -e POSTGRES_PASSWORD=test \
    -e POSTGRES_DB=restore_test \
    postgres:16-alpine

# Restore the dump
gunzip -c /var/backups/puraestate/LATEST/postgres-*.sql.gz | \
    docker exec -i pg-restore-test psql -U postgres restore_test

# Verify key tables exist
docker exec pg-restore-test psql -U postgres restore_test -c "\dt"

# Cleanup
docker rm -f pg-restore-test
```

### 10.5 Backup Retention Policy

| Backup Type | Retention | Storage |
|-------------|-----------|---------|
| Daily       | 30 days   | VPS local + S3 |
| Weekly      | 3 months  | S3 only |
| Monthly     | 1 year    | S3 Glacier |

---

## 11. Troubleshooting

### Container won't start

```bash
# Check container logs
docker compose logs <service-name>

# Check container exit code
docker compose ps

# Inspect container
docker inspect puraestate-flask
```

### PostgreSQL connection refused

```bash
# Check postgres health
docker compose exec postgres pg_isready -U puraestate

# Check postgres logs
docker compose logs postgres

# Connect manually
docker compose exec postgres psql -U puraestate puraestate_prod
```

### Nginx 502 Bad Gateway

```bash
# Check if flask is running
docker compose exec nginx curl -I http://flask:5000/health

# Check nginx config
docker compose exec nginx nginx -t

# Reload nginx
docker compose exec nginx nginx -s reload
```

### SSL Certificate Issues

```bash
# Check certificate status
openssl s_client -connect puraestate.com:443 -servername puraestate.com 2>&1 | \
    openssl x509 -noout -subject -issuer -dates

# Force renew
certbot renew --force-renewal

# Reload nginx after renewal
docker exec puraestate-nginx nginx -s reload
```

### Out of Disk Space

```bash
# Check disk usage
df -h

# Clean Docker resources
docker system prune -f          # Remove stopped containers, unused images
docker volume prune -f          # Remove unused volumes (CAREFUL!)
docker image prune -a -f        # Remove ALL unused images

# Check log sizes
du -sh /var/lib/docker/containers/*/  # Container log files
```

### Flask/Celery Memory Issues

```bash
# Increase Docker resource limits in docker-compose.yml
# flask service → deploy.resources.limits.memory: 2g

# Check current memory usage
docker stats --no-stream puraestate-flask puraestate-celery
```

---

## 12. Security Hardening

### 12.1 Regular Security Updates

```bash
# Set up unattended upgrades (security patches only)
apt install -y unattended-upgrades

cat > /etc/apt/apt.conf.d/50unattended-upgrades <<'EOF'
Unattended-Upgrade::Allowed-Origins {
    "${distro_id}:${distro_codename}-security";
};
Unattended-Upgrade::AutoFixInterruptedDpkg "true";
Unattended-Upgrade::Remove-Unused-Dependencies "true";
Unattended-Upgrade::Automatic-Reboot "false";
EOF

systemctl enable unattended-upgrades
```

### 12.2 Docker Security

```bash
# Enable Docker content trust
export DOCKER_CONTENT_TRUST=1

# Scan images for vulnerabilities (Docker Scout)
docker scout cves puraestate/flask-api:latest

# Run containers as non-root (already configured in Dockerfiles)
```

### 12.3 Network Security

```bash
# Block access to Flower (internal only, SSH tunnel required)
ufw deny 5555/tcp
ufw deny 5556/tcp

# Block n8n direct access
ufw deny 5678/tcp

# Only allow postgres/redis from Docker internal network
# (already handled by Docker network isolation)
```

### 12.4 Security Headers Verification

Test security headers at:
- https://securityheaders.com/?q=puraestate.com
- https://observatory.mozilla.org/analyze/puraestate.com

Expected results:
- `Strict-Transport-Security` – ✓ (max-age=63072000, includeSubDomains, preload)
- `X-Frame-Options` – ✓ (DENY)
- `X-Content-Type-Options` – ✓ (nosniff)
- `Content-Security-Policy` – ✓
- `Referrer-Policy` – ✓

### 12.5 Rate Limiting Verification

```bash
# Test rate limiting on auth endpoint
for i in {1..20}; do
    curl -s -o /dev/null -w "%{http_code}\n" \
        -X POST https://puraestate.com/api/v1/auth/login \
        -H "Content-Type: application/json" \
        -d '{"email":"test@test.com","password":"wrong"}'
done
# Should see 429 after ~5 requests
```

---

## Quick Reference

### Common Commands

```bash
# Start everything
docker compose up -d

# Stop everything
docker compose down

# Restart a service
docker compose restart flask

# View logs
docker compose logs -f --tail=100 flask

# Run migration
./deploy/scripts/db-migrate.sh upgrade

# Run backup
./deploy/scripts/backup.sh --s3

# Health check
./deploy/scripts/healthcheck.sh

# Deploy new version
./deploy/scripts/deploy.sh

# Get a shell in Flask container
docker compose exec flask bash

# Get psql shell
docker compose exec postgres psql -U puraestate puraestate_prod

# Get redis-cli
docker compose exec redis redis-cli -a $REDIS_PASSWORD
```

### Important File Locations

| File | Location |
|------|----------|
| Docker Compose config | `/home/deploy/puraestate/deploy/docker-compose.yml` |
| Environment variables | `/home/deploy/puraestate/deploy/.env` |
| Nginx config | `/home/deploy/puraestate/deploy/nginx/` |
| SSL certificates | `/etc/letsencrypt/live/puraestate.com/` |
| DH parameters | `/home/deploy/puraestate/deploy/nginx/ssl/dhparam.pem` |
| Deploy logs | `/var/log/puraestate/` |
| Backup directory | `/var/backups/puraestate/` |
| Nginx access log | Docker volume `puraestate-nginx-logs` |

---

*Last updated: 2026-02-22*
*Platform: PuraEstate SaaS v1.0.0*
