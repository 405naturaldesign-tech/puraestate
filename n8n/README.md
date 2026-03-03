# PuraEstate n8n Automation Workflows

Complete n8n workflow automation suite for PuraEstate South African property intelligence platform.
Self-hosted n8n on Hostinger VPS.

## Directory Structure

```
/home/tjdavis/n8n/
├── README.md                           <- This file
├── workflows/
│   ├── data-collection/
│   │   ├── 01_daily_property_scraping.json
│   │   ├── 02_facebook_marketplace_monitor.json
│   │   ├── 03_facebook_group_monitor.json
│   │   ├── 04_email_inbox_parsing.json
│   │   └── 05_webhook_ingestion.json
│   ├── alerts/
│   │   ├── 06_price_drop_alerts.json
│   │   ├── 07_new_listing_notifications.json
│   │   ├── 08_market_summary.json
│   │   └── 09_agent_performance_alerts.json
│   ├── integrations/
│   │   ├── 10_crm_sync_pipedrive.json
│   │   ├── 11_google_sheets_sync.json
│   │   ├── 12_email_campaigns.json
│   │   └── 13_slack_daily_listings_by_province.json
│   ├── admin/
│   │   ├── 14_database_backup.json
│   │   ├── 15_health_monitoring.json
│   │   ├── 16_data_quality.json
│   │   └── 17_report_generation.json
│   └── lead-management/
│       ├── 18_inquiry_form_processing.json
│       ├── 19_lead_scoring.json
│       └── 20_followup_reminders.json
├── config/
│   ├── credentials.env.template        <- Copy to .env and fill in
│   ├── n8n_credentials_setup.json      <- Credential setup guide
│   ├── webhook_urls.md                 <- Webhook documentation
│   └── database_schema.sql             <- Required DB tables
└── templates/
    └── workflow_schedule_summary.json  <- All schedules at a glance
```

## Prerequisites

### Server Requirements
- Ubuntu 20.04+ on Hostinger VPS
- Node.js 18+ (for n8n)
- PostgreSQL 14+ (for PuraEstate app and n8n)
- Python 3.10+ with Flask (existing backend)
- AWS CLI (for database backups)
- pg_dump (PostgreSQL client tools)

### Installed Services
- n8n (self-hosted)
- Flask API at http://localhost:5000
- PostgreSQL at localhost:5432
- Nginx (reverse proxy for n8n)

---

## Step 1: Install n8n on Hostinger VPS

```bash
# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install n8n globally
sudo npm install -g n8n

# Create n8n user
sudo useradd -r -s /bin/false n8n
sudo mkdir -p /home/n8n/.n8n
sudo chown n8n:n8n /home/n8n/.n8n
```

## Step 2: Configure n8n as a systemd Service

```bash
sudo nano /etc/systemd/system/n8n.service
```

Paste the following:
```ini
[Unit]
Description=n8n Workflow Automation
After=network.target postgresql.service

[Service]
Type=simple
User=n8n
WorkingDirectory=/home/n8n
Environment="N8N_HOST=0.0.0.0"
Environment="N8N_PORT=5678"
Environment="N8N_PROTOCOL=https"
Environment="N8N_EDITOR_BASE_URL=https://n8n.puraestate.co.za"
Environment="WEBHOOK_URL=https://n8n.puraestate.co.za"
Environment="N8N_ENCRYPTION_KEY=CHANGE_ME_32_CHAR_RANDOM_STRING"
Environment="N8N_BASIC_AUTH_ACTIVE=true"
Environment="N8N_BASIC_AUTH_USER=admin"
Environment="N8N_BASIC_AUTH_PASSWORD=CHANGE_ME_STRONG_PASSWORD"
Environment="DB_TYPE=postgresdb"
Environment="DB_POSTGRESDB_HOST=localhost"
Environment="DB_POSTGRESDB_PORT=5432"
Environment="DB_POSTGRESDB_DATABASE=n8n"
Environment="DB_POSTGRESDB_USER=n8n_user"
Environment="DB_POSTGRESDB_PASSWORD=CHANGE_ME"
# PuraEstate App Env Vars
Environment="FLASK_API_KEY=CHANGE_ME"
Environment="STAKEHOLDER_EMAILS=ceo@puraestate.co.za"
Environment="MANAGER_EMAIL=manager@puraestate.co.za"
Environment="OPS_EMAIL=ops@puraestate.co.za"
Environment="PIPEDRIVE_API_TOKEN=CHANGE_ME"
Environment="WHATSAPP_API_TOKEN=CHANGE_ME"
Environment="TWILIO_ACCOUNT_SID=CHANGE_ME"
Environment="TWILIO_AUTH_TOKEN=CHANGE_ME"
Environment="TWILIO_PHONE_NUMBER=+27XXXXXXXXX"
Environment="GOOGLE_SHEET_ID_PROPERTIES=CHANGE_ME"
Environment="AWS_S3_BACKUP_BUCKET=puraestate-backups"
Environment="AWS_REGION=af-south-1"
Environment="WEBHOOK_API_KEY_1=CHANGE_ME_RANDOM_32_CHAR"
ExecStart=/usr/bin/n8n start
Restart=always
RestartSec=10
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=n8n

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable n8n
sudo systemctl start n8n
sudo systemctl status n8n
```

## Step 3: Configure Nginx Reverse Proxy

```bash
sudo nano /etc/nginx/sites-available/n8n
```

```nginx
server {
    listen 80;
    server_name n8n.puraestate.co.za;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name n8n.puraestate.co.za;

    ssl_certificate /etc/letsencrypt/live/n8n.puraestate.co.za/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/n8n.puraestate.co.za/privkey.pem;

    location / {
        proxy_pass http://localhost:5678;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/n8n /etc/nginx/sites-enabled/
sudo certbot --nginx -d n8n.puraestate.co.za
sudo nginx -t && sudo systemctl reload nginx
```

## Step 4: Create PostgreSQL Database

```bash
sudo -u postgres psql

-- In psql:
CREATE USER puraestate_user WITH PASSWORD 'CHANGE_ME_STRONG_PASSWORD';
CREATE DATABASE puraestate OWNER puraestate_user;
CREATE USER n8n_user WITH PASSWORD 'CHANGE_ME_N8N_PASSWORD';
CREATE DATABASE n8n OWNER n8n_user;
\q

-- Apply schema
psql -U puraestate_user -d puraestate -f /home/tjdavis/n8n/config/database_schema.sql
```

## Step 5: Import Workflows into n8n

1. Open https://n8n.puraestate.co.za in browser
2. Login with admin credentials
3. Go to Workflows > Import
4. Import each JSON file in numbered order (01 through 20)
5. **Do NOT activate workflows yet**

## Step 6: Create Credentials in n8n

Go to Settings > Credentials and create each credential described in:
`/home/tjdavis/n8n/config/n8n_credentials_setup.json`

Required credentials:
- PostgreSQL (PuraEstate PostgreSQL)
- Slack (PuraEstate Slack)
- SMTP (PuraEstate SMTP)
- IMAP (for email parsing)
- Google Sheets OAuth2
- AWS

## Step 7: Create Required Slack Channels

In your Slack workspace, create these channels and invite the PuraEstate Bot:
```
#property-updates    - Daily scraping summaries
#new-listings        - New individual listings
#price-drops         - Price drop notifications
#alerts              - Critical system alerts
#daily-listings      - Daily overview for team
#market-reports      - Weekly market reports
#agent-performance   - Agent leaderboard
#data-quality        - Daily DQ report
#ops-alerts          - Infrastructure/backup alerts
#inbox-listings      - Email-sourced listings
#webhook-ingestion   - External webhook listings
#hot-leads           - High-score lead alerts
#follow-ups          - Daily follow-up reminders
#integrations        - Google Sheets sync updates
#reports             - Monthly analytics reports
#wc-listings         - Western Cape listings
#gp-listings         - Gauteng listings
#kzn-listings        - KwaZulu-Natal listings
#ec-listings         - Eastern Cape listings
```

## Step 8: Activate Workflows

Activate in this order:

### Phase 1 (Always-on webhooks first):
1. 05_webhook_ingestion
2. 18_inquiry_form_processing

### Phase 2 (Data collection):
3. 04_email_inbox_parsing
4. 01_daily_property_scraping
5. 02_facebook_marketplace_monitor
6. 03_facebook_group_monitor

### Phase 3 (Admin/monitoring):
7. 15_health_monitoring
8. 16_data_quality
9. 14_database_backup

### Phase 4 (Alerts):
10. 06_price_drop_alerts
11. 07_new_listing_notifications
12. 08_market_summary
13. 09_agent_performance_alerts

### Phase 5 (Integrations):
14. 10_crm_sync_pipedrive
15. 11_google_sheets_sync
16. 12_email_campaigns
17. 13_slack_daily_listings_by_province

### Phase 6 (Lead management):
18. 19_lead_scoring
19. 20_followup_reminders

---

## Workflow Descriptions

### Data Collection

| # | Workflow | Schedule | Description |
|---|----------|----------|-------------|
| 01 | Daily Property Scraping | 6:00 AM daily | Triggers Flask scraper, normalizes and stores all properties in PostgreSQL |
| 02 | Facebook Marketplace Monitor | Every 2 hours | Scrapes SA property listings from Facebook Marketplace |
| 03 | Facebook Group Monitor | Every 3 hours | Polls 7 SA real estate Facebook groups for new listings |
| 04 | Email Inbox Parser | Every 15 min | Reads listings@puraestate.co.za, extracts and stores forwarded property listings |
| 05 | Webhook Ingestion | Always-on | REST endpoint for external sources to push property listings |

### Alerts & Notifications

| # | Workflow | Schedule | Description |
|---|----------|----------|-------------|
| 06 | Price Drop Alerts | 9:00 AM daily | Detects price drops (>=3%), notifies Slack + emails subscribers + WhatsApp |
| 07 | New Listing Notifications | 8am/12pm/5pm | Matches new listings to saved searches, sends personalized emails + SMS |
| 08 | Market Summary | Monday 7AM | Weekly market report: prices, volumes, trends, by province and type |
| 09 | Agent Performance | Friday 8AM | Weekly agent leaderboard, conversion rates, alerts manager if below threshold |

### Integrations

| # | Workflow | Schedule | Description |
|---|----------|----------|-------------|
| 10 | CRM Sync (Pipedrive) | Every 30 min | Pushes new active properties to Pipedrive as deals with custom fields |
| 11 | Google Sheets Sync | Every 4 hours | Refreshes team Google Sheet with latest properties and summary stats |
| 12 | Email Campaigns | Wednesday 10AM | Weekly personalized property digest to email subscriber list |
| 13 | Slack Province Updates | Weekdays 8AM | Posts daily new listing count and top picks per province channel |

### Administrative

| # | Workflow | Schedule | Description |
|---|----------|----------|-------------|
| 14 | Database Backup | 2:00 AM daily | pg_dump PostgreSQL to gzipped file, uploads to S3, logs result |
| 15 | Health Monitoring | Every 10 min | Checks Flask, n8n, frontend and API health; alerts on repeated failures |
| 16 | Data Quality | 3:00 AM daily | Deduplicates by URL, flags stale listings, normalizes province names |
| 17 | Analytics Reports | 1st of month | Monthly analytics HTML report emailed to stakeholders |

### Lead Management

| # | Workflow | Schedule | Description |
|---|----------|----------|-------------|
| 18 | Inquiry Form Processing | Always-on webhook | Validates form submissions, creates leads, assigns agents, sends confirmation |
| 19 | Lead Scoring Engine | Every 6 hours | Recalculates lead scores based on behavior, alerts on new hot leads |
| 20 | Follow-up Reminders | Weekdays 8AM | Sends personalised daily follow-up digest to each agent by lead tier |

---

## Environment Variables Quick Reference

| Variable | Used By | Description |
|----------|---------|-------------|
| FLASK_API_KEY | 01, 02, 03 | Auth for Flask scraper API |
| SLACK_BOT_TOKEN | Multiple | Slack integration (set via n8n credential) |
| PIPEDRIVE_API_TOKEN | 10 | Pipedrive CRM API token |
| GOOGLE_SHEET_ID_PROPERTIES | 11 | Google Sheet ID for properties sync |
| WHATSAPP_API_TOKEN | 06 | Meta WhatsApp Business API |
| TWILIO_ACCOUNT_SID | 07 | SMS via Twilio |
| TWILIO_AUTH_TOKEN | 07 | SMS via Twilio |
| TWILIO_PHONE_NUMBER | 07 | Your Twilio SA number |
| AWS_S3_BACKUP_BUCKET | 14 | S3 bucket for backups |
| AWS_REGION | 14 | af-south-1 recommended |
| WEBHOOK_API_KEY_1 | 05 | API key for external webhook senders |
| STAKEHOLDER_EMAILS | 08, 17 | Comma-separated list for reports |
| MANAGER_EMAIL | 09 | Receives agent performance alerts |
| OPS_EMAIL | 15 | Receives infrastructure alerts |

---

## Troubleshooting

### n8n won't start
```bash
sudo journalctl -u n8n -n 50 --no-pager
```

### Check workflow execution logs
n8n UI > Executions tab (per workflow)

### Database connection issues
```bash
psql -U puraestate_user -d puraestate -c "SELECT 1;"
```

### Test Flask API connection
```bash
curl -H "Authorization: Bearer YOUR_FLASK_API_KEY" http://localhost:5000/health
```

### Webhook not receiving
```bash
# Check n8n is listening
curl http://localhost:5678/healthz

# Check nginx proxy
sudo nginx -t
sudo tail -f /var/log/nginx/error.log
```

### Reset n8n data (DESTRUCTIVE)
```bash
sudo systemctl stop n8n
rm -rf /home/n8n/.n8n/database.sqlite  # only if using SQLite
sudo systemctl start n8n
```

---

## Security Notes

1. Change all default passwords before going live
2. Enable IP allowlisting on /webhook endpoints where possible
3. Rotate WEBHOOK_API_KEY values every 90 days
4. Set up S3 bucket policies to restrict access
5. Use n8n's built-in credential encryption (set N8N_ENCRYPTION_KEY)
6. Enable n8n basic auth or use SSO in production
7. Keep n8n and Node.js updated regularly
8. Review n8n execution logs weekly for anomalies

---

## Support

- n8n Documentation: https://docs.n8n.io
- n8n Community: https://community.n8n.io
- Hostinger VPS: https://hpanel.hostinger.com
