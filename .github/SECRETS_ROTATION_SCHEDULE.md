# Secrets Rotation Schedule

## Overview

This document outlines the schedule and procedures for rotating API keys and secrets used by PuraEstate.

## Rotation Schedule

### 30-Day Rotation Cycle

The following secrets are rotated on a 30-day rolling schedule:

| Secret | Service | Rotation Date | Responsible Party |
|--------|---------|---------------|-------------------|
| `STRIPE_SECRET_KEY` | Stripe | 1st of each month | Finance/DevOps |
| `OPENROUTER_API_KEY` | OpenRouter | 10th of each month | Backend/DevOps |
| `FIREBASE_SERVICE_ACCOUNT` | Firebase | 20th of each month | DevOps/Backend |
| `AWS_SECRET_ACCESS_KEY` | AWS | 1st of each month | DevOps/Infrastructure |

### Monthly Schedule Example

```
March 2026:
- March 1: Stripe & AWS rotation (Monday)
- March 10: OpenRouter rotation (Wednesday)
- March 20: Firebase rotation (Friday)

April 2026:
- April 1: Stripe & AWS rotation (Wednesday)
- April 10: OpenRouter rotation (Friday)
- April 20: Firebase rotation (Monday)
```

## Rotation Process

### Pre-Rotation Checklist (3 days before)

- [ ] Schedule rotation window with team
- [ ] Prepare backup credentials
- [ ] Notify all teams using the secret
- [ ] Ensure deployment process is ready
- [ ] Test new credentials in staging

### Step-by-Step Rotation Process

#### 1. Generate New Credentials

For each service:

**Stripe:**
```bash
# Login to Stripe Dashboard
# Navigate to: Settings > API Keys > Reveal Test Key
# Generate new restricted API key with minimal required permissions
# Store temporarily in secure location
```

**OpenRouter:**
```bash
# Login to OpenRouter Dashboard
# Navigate to: Settings > API Keys
# Click "Create new API key"
# Set appropriate rate limits and usage restrictions
# Store temporarily in secure location
```

**Firebase:**
```bash
# Login to Firebase Console
# Navigate to: Project Settings > Service Accounts
# Generate new private key
# Download JSON file securely
# Store temporarily in secure location
```

**AWS:**
```bash
# Login to AWS IAM Console
# Navigate to: Users > [User] > Security Credentials > Access Keys
# Click "Create Access Key"
# Store Access Key ID and Secret Access Key securely
```

#### 2. Backup Current Credentials

```bash
# Create encrypted backup of current credentials
# Store in secure backup location (encrypted vault)
# Label with timestamp and expiration date
# Keep for 90 days in case rollback is needed
```

**Backup format:**
```
Backup Location: /secure/vault/secrets-backup/
Naming: [SECRET_NAME]-[DATE]-[BACKUP_NUMBER].enc
Expiration: [ROTATION_DATE + 90 days]
Verified: [Date verified by second party]
```

#### 3. Deploy New Credentials

**Step A: Update Staging Environment**
```bash
# 1. SSH into staging server
ssh staging.puraestate.com

# 2. Update environment variable
# - Edit .env.production in encrypted secrets manager
# - Do NOT edit directly in code repository
# - Use your secrets management tool (Vault, AWS Secrets Manager, etc.)

# 3. Restart application
sudo systemctl restart puraestate-app

# 4. Verify deployment
curl https://staging-api.puraestate.com/health
```

**Step B: Run Integration Tests**
```bash
# Run full integration test suite against staging
npm run test:integration:staging

# Verify key-dependent functions:
# - Payment processing (Stripe)
# - API calls (OpenRouter)
# - Database access (Firebase)
# - File uploads (AWS)
```

**Step C: Update Production Environment**
```bash
# 1. Coordinate with on-call engineer
# 2. Schedule during low-traffic window (off-peak hours)
# 3. Update production secrets in secrets manager
# 4. Deploy via CI/CD pipeline with approval
# 5. Monitor logs for 30 minutes post-deployment
```

**Step D: Verify Production**
```bash
# Run production health checks
curl https://api.puraestate.com/health

# Verify all dependent services:
# - Stripe webhook handlers
# - OpenRouter API calls
# - Firebase database operations
# - AWS S3 operations

# Monitor error logs and metrics for anomalies
```

#### 4. Revoke Old Credentials

**Stripe:**
```bash
# Login to Stripe Dashboard
# Navigate to: Settings > API Keys
# Click disable/revoke on old key
# Confirm revocation
```

**OpenRouter:**
```bash
# Login to OpenRouter Dashboard
# Navigate to: Settings > API Keys
# Click delete/revoke on old key
# Confirm revocation
```

**Firebase:**
```bash
# Login to Firebase Console
# Navigate to: Project Settings > Service Accounts
# Click delete on old key
# Confirm deletion
```

**AWS:**
```bash
# Login to AWS IAM Console
# Navigate to: Users > [User] > Security Credentials > Access Keys
# Click delete on old key
# Confirm deletion
```

### Post-Rotation Verification (Day 1)

- [ ] All services responding normally
- [ ] No error spikes in logs
- [ ] Stripe webhooks firing correctly
- [ ] OpenRouter API requests succeeding
- [ ] Firebase database queries working
- [ ] AWS S3 operations functioning
- [ ] Monitoring alerts all green
- [ ] Backup credentials stored securely

### Follow-Up (Day 3)

- [ ] Verify no service degradation
- [ ] Confirm no support tickets related to API failures
- [ ] Document any issues encountered
- [ ] Schedule next rotation

## Backup Credentials During Rotation

### Storage Requirements

**Secure Backup Vault:**
- Encrypted at-rest (AES-256)
- Encrypted in-transit (TLS 1.2+)
- Access restricted to: DevOps team leads only
- Audit logging enabled
- Automatic purge after 90 days

**Location Options:**
1. HashiCorp Vault (if available)
2. AWS Secrets Manager
3. Azure Key Vault
4. 1Password Business
5. Encrypted file system with restricted permissions

### Backup Format Example

```
Secret Name: STRIPE_SECRET_KEY
Date Created: 2026-03-01 14:30 UTC
Date Expires: 2026-03-31 23:59 UTC
Environment: production
Status: ACTIVE
Backup Number: stripe-2026-03-01-bak001
Verified By: [Team Lead Name]
Verification Date: 2026-03-01 15:00 UTC
```

### Emergency Rollback Procedure

If new credentials fail immediately:

1. Stop application deployment
2. Retrieve backup of previous credentials
3. Restore previous credentials to production
4. Restart services
5. Notify affected teams
6. Investigate failure cause
7. Attempt rotation again after fixing root cause

## Slack Notification Template

### Rotation Reminder (7 days before)

```
🔑 Upcoming Secrets Rotation

Service: [SERVICE_NAME]
Rotation Date: [DATE] at [TIME] UTC
Estimated Duration: 30-45 minutes

Teams Affected:
- Backend team
- DevOps team
- [Any other teams]

Action Items:
1. Prepare new credentials
2. Review rotation playbook
3. Ensure deployment access
4. Clear schedules for rotation window

Reminder in 3 days: Will ping again with final confirmation
```

### Rotation In Progress (Day of rotation)

```
⏳ Secrets Rotation In Progress

Service: [SERVICE_NAME]
Start Time: [TIME] UTC
Status: ROTATING

Current Step: [STEP_NAME]
Progress: [STEP X of Y]
ETA: [TIME] UTC

No new deployments during this window.
Do not restart services.
Monitor #alerts channel for issues.
```

### Rotation Completed

```
✅ Secrets Rotation Completed

Service: [SERVICE_NAME]
Completion Time: [TIME] UTC
Duration: [X] minutes
Status: SUCCESSFUL

Verification Results:
✅ Staging tests passed
✅ Production health checks passed
✅ No error spikes detected
✅ Old credentials revoked

Next rotation: [DATE]
Questions? Contact @devops-team
```

### Rotation Failed

```
⚠️ Secrets Rotation Failed

Service: [SERVICE_NAME]
Failure Time: [TIME] UTC
Status: ROLLED BACK

Issue: [BRIEF_DESCRIPTION]

Action Taken:
- ✅ Previous credentials restored
- ✅ Services restarted
- ✅ Production verified

Investigation:
- Root cause: [BRIEF_DESCRIPTION]
- Fix required: [ACTION_ITEM]
- Retry date: [DATE]

Details in thread. Contact @devops-lead for questions.
```

## Verification Procedure Post-Rotation

### Immediate Verification (Minutes 0-5)

```bash
# Health check endpoint
curl -i https://api.puraestate.com/health

# Expected response: 200 OK with version info
```

### Service-Specific Tests (Minutes 5-15)

**Stripe:**
```bash
# Test payment processing
POST /api/payments/test
{
  "amount": 100,
  "currency": "USD",
  "test_mode": true
}

# Expected: 200 OK with payment confirmation
```

**OpenRouter:**
```bash
# Test API calls
POST /api/ai/test
{
  "model": "openrouter/auto",
  "prompt": "Hello, test"
}

# Expected: 200 OK with AI response
```

**Firebase:**
```bash
# Test database read
GET /api/test/firebase

# Expected: 200 OK with sample data
```

**AWS S3:**
```bash
# Test file upload
POST /api/uploads/test
[multipart form data with test file]

# Expected: 200 OK with S3 URL
```

### Monitoring Checks (Minutes 15-30)

- [ ] Error rate < 0.5% (baseline)
- [ ] Response latency normal (< 200ms p95)
- [ ] No spike in 4xx errors
- [ ] No spike in 5xx errors
- [ ] Database connection pool healthy
- [ ] Webhook processing normal
- [ ] Cache hits > 80%

### Logging Verification (Minutes 30-60)

```bash
# Check for authentication errors
grep "401\|403\|UNAUTHORIZED" /var/log/puraestate.log | wc -l
# Should be 0 (or baseline level)

# Check for service errors related to APIs
grep "STRIPE\|OPENROUTER\|FIREBASE\|AWS" /var/log/puraestate.log | grep ERROR | wc -l
# Should be 0 (or baseline level)

# Check for warnings
grep "WARN" /var/log/puraestate.log | tail -20
# Review for any auth-related warnings
```

## Automation

### Cron Job for Rotation Reminders

```bash
# Schedule rotation reminders 7 days before rotation date
0 9 * * * /opt/scripts/rotation-reminder.sh >> /var/log/rotation.log 2>&1
```

### CI/CD Integration

```yaml
# Example: GitHub Actions workflow for rotation
name: Secrets Rotation Reminder
on:
  schedule:
    - cron: '0 9 1 * *'  # 1st of month

jobs:
  remind-stripe-rotation:
    runs-on: ubuntu-latest
    steps:
      - name: Post to Slack
        uses: slackapi/slack-github-action@v1
        with:
          payload: |
            {
              "text": "🔑 Stripe key rotation due in 7 days"
            }
```

## Emergency Rotation

In case of key compromise:

1. **Immediately revoke** the compromised key in the service dashboard
2. **Generate** new credentials immediately
3. **Deploy** new credentials to staging first
4. **Test thoroughly** (especially payment processing and API calls)
5. **Deploy** to production without waiting for scheduled window
6. **Monitor** closely for 1 hour
7. **Notify** security team and affected customers if necessary
8. **Document** the incident in incident log

## Contacts

**Rotation Coordinator:** [DevOps Lead Name] - devops-lead@puraestate.com

**Escalation:**
- Finance/Stripe Issues: [Finance Lead] - finance@puraestate.com
- Backend/API Issues: [Backend Lead] - backend@puraestate.com
- Infrastructure/AWS Issues: [Infrastructure Lead] - infrastructure@puraestate.com
- Firebase/Database Issues: [Database Lead] - database@puraestate.com

---

**Last Updated:** March 12, 2026
**Next Review Date:** June 12, 2026
**Review Frequency:** Quarterly
