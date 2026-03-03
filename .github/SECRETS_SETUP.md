# GitHub Secrets Setup Guide

## Overview

This guide explains how to set up all required GitHub Secrets for PuraEstate CI/CD pipeline.

## Repository Secrets vs Environment Secrets

- **Repository Secrets**: Available to all workflows in the repository
- **Environment Secrets**: Scoped to specific environments (development, staging, production)

Recommended approach: Use environment secrets for environment-specific values.

## Required Secrets

### 1. Build & Deployment Secrets

#### EXPO_TOKEN
**Purpose**: Authenticate with Expo services for building and publishing

**How to get it**:
1. Sign in to https://expo.dev
2. Go to Account settings → API Tokens
3. Create new token → Copy the token
4. Set as Repository Secret: `EXPO_TOKEN`

**Example**: `e1234567890abcdef1234567890abc123456789`

#### GOOGLE_PLAY_SERVICE_ACCOUNT_JSON
**Purpose**: Authenticate with Google Play Store for app submission

**How to get it**:
1. Go to Google Play Console
2. Settings → API & services → Service accounts
3. Create new service account
4. Generate new JSON key
5. Encode to base64: `cat key.json | base64 -w 0`
6. Set as Repository Secret: `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON`

**Environment Secrets**:
- `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON` (staging)
- `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON` (production)

#### KEYSTORE_BASE64
**Purpose**: Android signing certificate

**How to get it**:
1. Generate keystore if not exists:
   ```bash
   keytool -genkey -v -keystore release.keystore -keyalg RSA -keysize 2048 -validity 10000 -alias release
   ```
2. Encode to base64:
   ```bash
   cat release.keystore | base64 -w 0 > keystore.b64
   ```
3. Set as Environment Secret for production

#### KEYSTORE_PASSWORD, KEY_ALIAS, KEY_PASSWORD
**Purpose**: Keystore credentials

Set each as a separate Environment Secret for production:
- `KEYSTORE_PASSWORD`
- `KEY_ALIAS`
- `KEY_PASSWORD`

### 2. Monitoring & Error Tracking

#### SENTRY_AUTH_TOKEN
**Purpose**: Authenticate with Sentry for error tracking

**How to get it**:
1. Go to https://sentry.io
2. Settings → Auth Tokens
3. Create new token with project permissions
4. Set as Repository Secret: `SENTRY_AUTH_TOKEN`

**Example**: `sntrys_1234567890abcdef1234567890abc123456789`

#### SENTRY_DSN (Environment-specific)
**Purpose**: Sentry project endpoint

**How to get it**:
1. Go to Sentry project settings
2. Copy Client Key (DSN)
3. Set as Environment Secret for each environment

**Format**: `https://[key]@[domain]/[project-id]`

### 3. Notifications

#### SLACK_WEBHOOK_URL (Environment-specific)
**Purpose**: Send deployment notifications to Slack

**How to get it**:
1. Go to Slack workspace → Apps → Custom integrations
2. Incoming WebHooks → Create new webhook
3. Choose channel → Copy webhook URL
4. Set as Environment Secret for each environment

**Environment Secrets**:
- `SLACK_WEBHOOK_URL` (development)
- `SLACK_WEBHOOK_URL` (staging)
- `SLACK_WEBHOOK_URL` (production)

**Format**: `https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXX`

### 4. Security Scanning

#### SNYK_TOKEN
**Purpose**: SNYK security vulnerability scanning

**How to get it**:
1. Go to https://snyk.io
2. Account settings → Auth tokens
3. Create new token
4. Set as Repository Secret: `SNYK_TOKEN`

### 5. Apple App Store Deployment (Optional)

#### APPLE_ID
**Purpose**: Apple Developer account email

Set as Environment Secret for production:
- `APPLE_ID`

#### APPLE_ID_PASSWORD
**Purpose**: App-specific password for Apple ID

**How to get it**:
1. Go to appleid.apple.com
2. Security section → App-Specific Passwords
3. Generate new password for "App Store"
4. Set as Environment Secret for production

#### APPLE_TEAM_ID
**Purpose**: Apple Developer Team ID

**How to get it**:
1. Go to developer.apple.com
2. Account → Membership details
3. Copy Team ID
4. Set as Repository Secret: `APPLE_TEAM_ID`

### 6. Database Secrets (Environment-specific)

Set as Environment Secrets for each environment:

#### DB_HOST
- Development: `localhost`
- Staging: Your staging database host
- Production: Your production database host

#### DB_USER
- Database username

#### DB_PASSWORD
- Database password (use strong password for production)

#### DB_NAME
- Database name

**Storage**: Set all as Environment Secrets, NOT Repository Secrets

### 7. Firebase Configuration (Environment-specific)

Set as Environment Secrets:

#### FIREBASE_API_KEY
```bash
# From Firebase Console → Project Settings → Web apps
```

#### FIREBASE_PROJECT_ID
```bash
# From Firebase Console
```

#### FIREBASE_STORAGE_BUCKET
```bash
# Format: project-name.appspot.com
```

#### FIREBASE_MESSAGING_SENDER_ID, FIREBASE_APP_ID, FIREBASE_MEASUREMENT_ID
```bash
# From Firebase Console
```

#### FIREBASE_ADMIN_SDK_KEY
**Format**: JSON encoded admin SDK key
```bash
# From Firebase Console → Service Accounts
cat admin-key.json | base64 -w 0
```

### 8. Third-party API Keys (Environment-specific)

Set as Environment Secrets:

#### GOOGLE_MAPS_API_KEY
```bash
# From Google Cloud Console
```

#### STRIPE_PUBLIC_KEY, STRIPE_SECRET_KEY
```bash
# From Stripe Dashboard
```

#### SENDGRID_API_KEY
```bash
# From SendGrid Dashboard
```

## Setting Up Secrets in GitHub

### For Repository Secrets

1. Go to Repository → Settings → Secrets and variables → Actions
2. Click "New repository secret"
3. Enter name (e.g., `EXPO_TOKEN`)
4. Enter value
5. Click "Add secret"

### For Environment Secrets

1. Go to Repository → Settings → Environments
2. Create new environment (e.g., `production`, `staging`)
3. Click environment → Add environment secret
4. Enter name and value
5. Click "Add secret"

**Note**: If using branch protection, configure which environments can deploy.

## Validation Checklist

- [ ] EXPO_TOKEN set and valid
- [ ] GOOGLE_PLAY_SERVICE_ACCOUNT_JSON set for production
- [ ] KEYSTORE_BASE64, KEYSTORE_PASSWORD, KEY_ALIAS, KEY_PASSWORD set for production
- [ ] SENTRY_AUTH_TOKEN set
- [ ] SENTRY_DSN set for each environment
- [ ] SLACK_WEBHOOK_URL set for each environment
- [ ] SNYK_TOKEN set
- [ ] Database credentials set for each environment
- [ ] Firebase configuration set for each environment
- [ ] All secrets encrypted and not visible in logs

## Security Best Practices

1. **Rotate secrets regularly**
   - Every 90 days for production
   - When team members leave
   - After suspected compromise

2. **Use environment-specific secrets**
   - Never share production secrets
   - Use staging for testing

3. **Monitor secret usage**
   - Check GitHub Actions logs for leaks
   - Set up Slack alerts for deployments
   - Review audit logs regularly

4. **Never hardcode secrets**
   - Always use GitHub Secrets
   - Don't commit to git
   - Don't share via email/chat

5. **Use strong passwords**
   - Minimum 32 characters
   - Mix of upper, lower, numbers, special chars
   - Use password manager to generate

## Troubleshooting

### Secret not found in workflow
- Confirm secret name matches (case-sensitive)
- Check that secret is set in correct scope (repo vs environment)
- Restart failed workflow after adding secret

### Deployment fails with authentication error
- Verify secret value is correct
- Check if secret has expired (tokens, API keys)
- Regenerate secret if expired

### Secrets visible in logs
- Immediately rotate the secret
- Check "Mask values in logs" is enabled
- Review GitHub Actions logs for exposure

## Compliance & Auditing

- All secrets are encrypted by GitHub
- Access logs available in Security settings
- Rotate secrets every 90 days
- Annual security audit recommended

## Testing Secrets

Before production deployment, verify secrets work:

```bash
# Test EXPO_TOKEN
eas --version

# Test Google Play credentials
# (Use EAS build staging first)

# Test Slack webhook
curl -X POST $SLACK_WEBHOOK_URL \
  -H 'Content-Type: application/json' \
  -d '{"text":"Test message"}'
```

## Automated Secret Scanning

GitHub automatically scans for exposed secrets:
- Monitors public repositories
- Alerts on detected patterns
- Blocks commits with secrets

Enable additional scanning:
1. Settings → Security analysis → Enable advanced security
2. Enable secret scanning
3. Enable push protection

## Next Steps

1. Set up all required secrets from this guide
2. Test each secret individually
3. Run test workflow to verify
4. Enable branch protection
5. Configure environments for deployment
6. Monitor first few deployments closely
